import { Matrix, dotProduct } from '../../math/matrix'
import { createRng } from '../../math/prng'

export interface LoraFrame {
  step: number
  A: Matrix
  B: Matrix
  delta: Matrix
  /** Signed error, (α/r)BA − target. */
  residual: Matrix
  mse: number
  loss: number
}

function evaluate(target: Matrix, A: Matrix, B: Matrix, scale: number) {
  const delta = B.matmul(A).scale(scale)
  const residual = delta.sub(target)
  const squared = dotProduct(residual.data, residual.data)
  return { delta, residual, mse: squared / target.data.length, loss: squared / 2 }
}

export function loraGradients(target: Matrix, A: Matrix, B: Matrix, alpha: number) {
  const scale = alpha / A.rows
  const result = evaluate(target, A, B, scale)
  const dA = B.transpose().matmul(result.residual).scale(scale)
  const dB = result.residual.matmul(A.transpose()).scale(scale)
  return { ...result, dA, dB }
}

/** For one fixed factor, O(θ − ηg) = O(θ) − ηD. Minimizing the line's
 * quadratic loss gives η = ||g||² / ||D||². No reference SVD enters training. */
function takeGradientStep(factor: Matrix, gradient: Matrix, direction: Matrix) {
  const curvature = dotProduct(direction.data, direction.data)
  if (curvature === 0) return factor
  const rate = dotProduct(gradient.data, gradient.data) / curvature
  return factor.sub(gradient.scale(rate))
}

export function trainLora(target: Matrix, rank: number, alpha: number, zeroInitB = true, steps = 100, seed = 42): LoraFrame[] {
  if (!Number.isInteger(rank) || rank < 1 || rank > Math.min(target.rows, target.cols) || !(alpha > 0) || !Number.isFinite(alpha)) {
    throw new RangeError('Invalid adapter rank or gain')
  }
  if (!Number.isInteger(steps) || steps < 0) throw new RangeError('Invalid training steps')
  const rng = createRng(seed), scale = alpha / rank
  let A = Matrix.randomNormal(rank, target.cols, rng, Math.sqrt(2 / target.cols))
  let B = zeroInitB ? Matrix.zeros(target.rows, rank) : Matrix.randomNormal(target.rows, rank, rng, Math.sqrt(2 / rank))
  const frames: LoraFrame[] = []
  for (let step = 0; step <= steps; step++) {
    const result = evaluate(target, A, B, scale)
    frames.push({ step, A, B, ...result })
    if (step === steps) break
    const dB = result.residual.matmul(A.transpose()).scale(scale)
    B = takeGradientStep(B, dB, dB.matmul(A).scale(scale))
    const residualAfterB = B.matmul(A).scale(scale).sub(target)
    const dA = B.transpose().matmul(residualAfterB).scale(scale)
    A = takeGradientStep(A, dA, B.matmul(dA).scale(scale))
  }
  return frames
}
