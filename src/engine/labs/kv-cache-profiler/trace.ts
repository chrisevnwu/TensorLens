import { Matrix, stableSoftmax } from '../../math/matrix'
import { createRng } from '../../math/prng'

const DIM = 8
const DECODE_STEPS = 8
const PROMPT = [1, 4, 2, 6]

export interface DecodePath {
  queryRows: number[]
  projectedRows: number[]
  reusedRows: number[]
  weights: number[][]
  /** Attention output for the last token in the current context. */
  output: number[]
  flops: number
  cumulativeFlops: number
}

export interface DecodeFrame {
  step: number
  phase: 'prefill' | 'decode'
  length: number
  dim: number
  tokenIds: number[]
  cached: DecodePath
  uncached: DecodePath
}

interface ToyModel {
  Wq: Matrix
  Wk: Matrix
  Wv: Matrix
}
interface KvRows { keys: number[][]; values: number[][] }

function runAttention(inputs: number[][], model: ToyModel, historyFlops: number, cache?: KvRows): DecodePath {
  const firstQuery = cache?.keys.length ?? 0
  const X = Matrix.from2D(inputs.slice(firstQuery))
  let flops = 0
  // Count dense Q/K/V, QKᵀ and AV using two FLOPs per multiply–accumulate.
  // Masking, softmax, embedding lookup, and the vocabulary readout are outside this counter.
  function multiply(a: Matrix, b: Matrix) {
    flops += 2 * a.rows * a.cols * b.cols
    return a.matmul(b)
  }
  const queries = multiply(X, model.Wq)
  const kv = cache ?? { keys: [], values: [] }
  kv.keys.push(...multiply(X, model.Wk).to2D())
  kv.values.push(...multiply(X, model.Wv).to2D())
  const scores = multiply(queries, Matrix.from2D(kv.keys).transpose())
  const weights = scores.to2D().map((row, r) => stableSoftmax(row.map((score, c) =>
    c > firstQuery + r ? -Infinity : score / Math.sqrt(DIM))))
  const outputs = multiply(Matrix.from2D(weights), Matrix.from2D(kv.values))
  const queryRows = Array.from({ length: X.rows }, (_, i) => i + firstQuery)
  return {
    queryRows, projectedRows: [...queryRows], reusedRows: Array.from({ length: firstQuery }, (_, i) => i),
    weights, output: Array.from(outputs.row(outputs.rows - 1)), flops, cumulativeFlops: historyFlops + flops,
  }
}

export function buildDecodeTrace(seed = 42): DecodeFrame[] {
  const rng = createRng(seed)
  const vocabulary = Matrix.randomNormal(16, DIM, rng)
  const projection = () => Matrix.randomNormal(DIM, DIM, rng, 1 / Math.sqrt(DIM))
  const model = { Wq: projection(), Wk: projection(), Wv: projection() }
  const readout = Matrix.randomNormal(DIM, vocabulary.rows, rng, 1 / Math.sqrt(DIM))
  function embedding(id: number, position: number) {
    return Array.from(vocabulary.row(id), (v, j) => {
      const phase = position * 10000 ** (-2 * Math.floor(j / 2) / DIM)
      return v + (j % 2 === 0 ? Math.sin(phase) : Math.cos(phase))
    })
  }
  const tokenIds = [...PROMPT]
  const inputs = tokenIds.map(embedding)
  const cache: KvRows = { keys: [], values: [] }
  const trace: DecodeFrame[] = []
  for (let step = 0; step <= DECODE_STEPS; step++) {
    const previous = trace.at(-1)
    const cached = runAttention(inputs, model, previous?.cached.cumulativeFlops ?? 0, cache)
    const uncached = runAttention(inputs, model, previous?.uncached.cumulativeFlops ?? 0)
    trace.push({ step, phase: step === 0 ? 'prefill' : 'decode', length: inputs.length, dim: DIM, tokenIds: [...tokenIds], cached, uncached })
    if (step < DECODE_STEPS) {
      const logits = Matrix.from2D([cached.output]).matmul(readout).row(0)
      const id = logits.indexOf(Math.max(...logits))
      inputs.push(embedding(id, tokenIds.length))
      tokenIds.push(id)
    }
  }
  return trace
}
