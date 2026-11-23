import { Matrix, dotProduct, stableSoftmax } from '../../math/matrix'
import { createRng } from '../../math/prng'

export interface FlashConfig {
  seqLen: number
  blockBr: number
  blockBc: number
  causalMask: boolean
}

export interface FlashFrame {
  phase: 'load-q' | 'load-kv' | 'compute' | 'skip' | 'write'
  i: number
  j: number
  rowStart: number
  rows: number
  colStart: number
  cols: number
  /** Cumulative HBM transfers in elements; bytes assumes two bytes per element. */
  reads: number
  writes: number
  bytes: number
  skippedTiles: number
  mBefore: number[]
  lBefore: number[]
  m: number[]
  l: number[]
  alpha: number[]
  scores: number[][]
  p: number[][]
  accumulator: number[][]
}

interface Transfer { reads: number; writes: number; bytes: number }
export interface FlashResult {
  Q: Matrix
  K: Matrix
  V: Matrix
  flashOutput: Matrix
  naiveOutput: Matrix
  trace: FlashFrame[]
  maxAbsError: number
  skippedTiles: number
  flashBytes: number
  standardBytes: number
  standardTransfers: Transfer[]
}

function checkShape(Q: Matrix, K: Matrix, V: Matrix) {
  if (!Q.rows || !Q.cols || Q.rows !== K.rows || Q.rows !== V.rows || Q.cols !== K.cols || Q.cols !== V.cols) {
    throw new RangeError('Expected matching nonempty Q, K and V shapes')
  }
}

function standardAttention(Q: Matrix, K: Matrix, V: Matrix, causal: boolean) {
  checkShape(Q, K, V)
  const footprint = (reads: number, writes: number) => ({ reads, writes, bytes: 2 * (reads + writes) })
  const scores = Q.matmul(K.transpose()).map((v, i, j) => causal && j > i ? -Infinity : v / Math.sqrt(Q.cols))
  const projections = footprint(Q.data.length + K.data.length, scores.data.length)
  const probabilities = Matrix.from2D(scores.to2D().map(row => stableSoftmax(row)))
  const softmax = footprint(scores.data.length, probabilities.data.length)
  const output = probabilities.matmul(V)
  const mixing = footprint(probabilities.data.length + V.data.length, output.data.length)
  const transfers = [projections, softmax, mixing]
  return { output, transfers, bytes: transfers.reduce((sum, t) => sum + t.bytes, 0) }
}

export function naiveAttention(Q: Matrix, K: Matrix, V: Matrix, causal: boolean) {
  return standardAttention(Q, K, V, causal).output
}

export function tileAttention(Q: Matrix, K: Matrix, V: Matrix, blockBr: number, blockBc: number, causal: boolean) {
  checkShape(Q, K, V)
  if (![blockBr, blockBc].every(size => Number.isInteger(size) && size > 0)) throw new RangeError('Invalid tile shape')
  const dim = Q.cols, n = Q.rows, scale = 1 / Math.sqrt(dim)
  const flashOutput = Matrix.zeros(n, dim), trace: FlashFrame[] = []
  let reads = 0, writes = 0, skippedTiles = 0
  // Each transfer copies precisely the elements that would cross the HBM/SRAM boundary.
  function load(matrix: Matrix, start: number, count: number) {
    reads += count * matrix.cols
    return Array.from({ length: count }, (_, i) => matrix.row(i + start))
  }
  for (let rowStart = 0; rowStart < n; rowStart += blockBr) {
    const rows = Math.min(blockBr, n - rowStart)
    const query = load(Q, rowStart, rows)
    let m: number[] = Array(rows).fill(-Infinity), l: number[] = Array(rows).fill(0)
    let accumulator: number[][] = Array.from({ length: rows }, () => Array(dim).fill(0))
    function record(phase: FlashFrame['phase'], colStart = -1, cols = 0, tile?: Pick<FlashFrame, 'scores'|'p'|'alpha'|'mBefore'|'lBefore'>) {
      // The online updates replace arrays rather than mutating an earlier trace snapshot.
      trace.push({ phase, i: Math.floor(rowStart / blockBr), j: colStart < 0 ? -1 : Math.floor(colStart / blockBc),
        rowStart, rows, colStart, cols, reads, writes, bytes: 2 * (reads + writes), skippedTiles,
        m, l, accumulator, mBefore: m, lBefore: l, scores: [], p: [], alpha: [], ...tile })
    }
    record('load-q')
    for (let colStart = 0; colStart < n; colStart += blockBc) {
      const cols = Math.min(blockBc, n - colStart)
      if (causal && rowStart + rows - 1 < colStart) {
        skippedTiles++
        record('skip', colStart, cols)
        continue
      }
      const keys = load(K, colStart, cols), values = load(V, colStart, cols)
      record('load-kv', colStart, cols)
      const scores = query.map((q, r) => keys.map((k, c) => causal && colStart + c > rowStart + r ? -Infinity : dotProduct(q, k) * scale))
      const mBefore = m, lBefore = l
      m = scores.map((row, r) => Math.max(mBefore[r]!, ...row))
      const alpha = m.map((maximum, r) => maximum === -Infinity ? 1 : Math.exp(mBefore[r]! - maximum))
      const p = scores.map((row, r) => row.map(score => score === -Infinity ? 0 : Math.exp(score - m[r]!)))
      l = p.map((row, r) => row.reduce((sum, v) => sum + v, alpha[r]! * lBefore[r]!))
      accumulator = accumulator.map((row, r) => row.map((old, k) => {
        let sum = alpha[r]! * old
        for (let c = 0; c < cols; c++) sum += p[r]![c]! * values[c]![k]!
        return sum
      }))
      record('compute', colStart, cols, { mBefore, lBefore, alpha, scores, p })
    }
    accumulator = accumulator.map((row, r) => row.map(value => value / l[r]!))
    accumulator.forEach((row, r) => flashOutput.data.set(row, (rowStart + r) * dim))
    writes += rows * dim
    record('write')
  }
  return { flashOutput, trace, skippedTiles, flashBytes: 2 * (reads + writes) }
}

export function simulateFlash(config: FlashConfig, seed = 42): FlashResult {
  const rng = createRng(seed)
  const next = () => Matrix.randomNormal(config.seqLen, 4, rng)
  const Q = next(), K = next(), V = next()
  const tiled = tileAttention(Q, K, V, config.blockBr, config.blockBc, config.causalMask)
  const standard = standardAttention(Q, K, V, config.causalMask)
  let maxAbsError = 0
  for (let i = 0; i < standard.output.data.length; i++) {
    maxAbsError = Math.max(maxAbsError, Math.abs(standard.output.data[i]! - tiled.flashOutput.data[i]!))
  }
  return { Q, K, V, ...tiled, naiveOutput: standard.output, standardBytes: standard.bytes, standardTransfers: standard.transfers, maxAbsError }
}
