import { Matrix } from './matrix'

export interface SVDResult {
  U: Matrix
  S: number[]
  V: Matrix
  totalEnergy: number
}

function rotateColumns(matrix: Matrix, p: number, q: number, cosine: number, sine: number) {
  for (let row = 0; row < matrix.rows; row++) {
    const x = matrix.get(row, p), y = matrix.get(row, q)
    matrix.set(row, p, cosine * x - sine * y)
    matrix.set(row, q, sine * x + cosine * y)
  }
}

function jacobiSweep(work: Matrix, right: Matrix) {
  let rotated = false
  for (let p = 0; p < work.cols; p++) {
    for (let q = p + 1; q < work.cols; q++) {
      let aa = 0, bb = 0, ab = 0
      for (let r = 0; r < work.rows; r++) {
        const a = work.get(r, p), b = work.get(r, q)
        aa += a * a
        bb += b * b
        ab += a * b
      }
      if (Math.abs(ab) <= 4 * Number.EPSILON * Math.sqrt(aa) * Math.sqrt(bb)) continue
      // Root of the Jacobi quadratic with |tan(theta)| <= 1.
      const zeta = (bb - aa) / (2 * ab)
      const tangent = (zeta < 0 ? -1 : 1) / (Math.abs(zeta) + Math.hypot(1, zeta))
      const cosine = 1 / Math.hypot(1, tangent)
      const sine = tangent * cosine
      rotateColumns(work, p, q, cosine, sine)
      rotateColumns(right, p, q, cosine, sine)
      rotated = true
    }
  }
  return rotated
}

/** Complete a zero singular direction with the best-conditioned projected coordinate axis. */
function completeOrthonormalColumn(basis: Matrix, col: number) {
  let axis = 0, leastProjection = Infinity
  for (let r = 0; r < basis.rows; r++) {
    let projection = 0
    for (let c = 0; c < col; c++) projection += basis.get(r, c) ** 2
    if (projection < leastProjection) { axis = r; leastProjection = projection }
  }
  let norm = 0
  for (let r = 0; r < basis.rows; r++) {
    let value = r === axis ? 1 : 0
    for (let c = 0; c < col; c++) value -= basis.get(axis, c) * basis.get(r, c)
    basis.set(r, col, value)
    norm = Math.hypot(norm, value)
  }
  for (let r = 0; r < basis.rows; r++) basis.set(r, col, basis.get(r, col) / norm)
}

export function computeSVD(matrix: Matrix, maxSweeps = 80): SVDResult {
  if (matrix.rows < matrix.cols) {
    const result = computeSVD(matrix.transpose(), maxSweeps)
    return { ...result, U: result.V, V: result.U }
  }
  let scale = 0
  for (const value of matrix.data) scale = Math.max(scale, Math.abs(value))
  const work = matrix.map(v => v / (scale || 1))
  const right = Matrix.identity(matrix.cols)
  for (let sweep = 0; sweep < maxSweeps; sweep++) {
    if (!jacobiSweep(work, right)) break
  }
  const columns = Array.from({ length: matrix.cols }, (_, col) => {
    let length = 0
    for (let r = 0; r < matrix.rows; r++) length = Math.hypot(length, work.get(r, col))
    return { col, length }
  }).sort((a, b) => b.length - a.length)

  const U = Matrix.zeros(matrix.rows, matrix.cols)
  const V = Matrix.zeros(matrix.cols, matrix.cols)
  const S: number[] = []
  const threshold = (columns[0]?.length ?? 0) * matrix.rows * Number.EPSILON
  for (const [index, { col, length }] of columns.entries()) {
    for (let r = 0; r < V.rows; r++) V.set(r, index, right.get(r, col))
    if (length <= threshold) {
      S.push(0)
      completeOrthonormalColumn(U, index)
    } else {
      S.push(length * scale)
      for (let r = 0; r < U.rows; r++) U.set(r, index, work.get(r, col) / length)
    }
  }
  return { U, S, V, totalEnergy: S.reduce((sum, sigma) => sum + sigma * sigma, 0) }
}

export function reconstructRankR({ U, S, V }: SVDResult, rank: number) {
  const count = Math.max(0, Math.min(Math.trunc(rank), S.length))
  return Matrix.zeros(U.rows, V.rows).map((_, r, c) => {
    let value = 0
    for (let j = 0; j < count; j++) value += U.get(r, j) * S[j]! * V.get(c, j)
    return value
  })
}
