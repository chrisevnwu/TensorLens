import { expect, it } from 'vitest'
import { Matrix } from '../../../math/matrix'
import { createRng } from '../../../math/prng'
import { loraGradients, trainLora } from '../training'

it('derives each A and B gradient from the actual half-squared Frobenius loss', () => {
  const rng = createRng(104)
  const target = Matrix.randomNormal(5, 3, rng), A = Matrix.randomNormal(2, 3, rng), B = Matrix.randomNormal(5, 2, rng)
  const alpha = 7, s = alpha / A.rows
  const { dA, dB } = loraGradients(target, A, B, alpha)
  function loss() {
    let sum = 0
    for (let i = 0; i < target.rows; i++) for (let j = 0; j < target.cols; j++) {
      let value = 0
      for (let k = 0; k < A.rows; k++) value += s * B.get(i,k) * A.get(k,j)
      sum += (value - target.get(i,j)) ** 2 / 2
    }
    return sum
  }
  for (const [matrix, gradient] of [[A,dA],[B,dB]] as const) {
    for (let i = 0; i < matrix.data.length; i++) {
      const x = matrix.data[i]!, h = 1e-5
      matrix.data[i] = x+h; const plus = loss()
      matrix.data[i] = x-h; const minus = loss()
      matrix.data[i] = x
      expect(gradient.data[i]).toBeCloseTo((plus-minus)/(2*h), 6)
    }
  }
})

it('starts from seeded factors and trains without relying on the target singular vectors', () => {
  const target = Matrix.randomNormal(16,16,createRng(93))
  for (const rank of [1, 4, 16]) for (const alpha of [1, 8, 32]) for (const zeroB of [false, true]) {
    const frames = trainLora(target, rank, alpha, zeroB, 25)
    expect(frames).toHaveLength(26)
    if (zeroB) expect(frames[0]!.delta.frobeniusNorm()).toBe(0)
    else expect(frames[0]!.delta.frobeniusNorm()).toBeGreaterThan(0)
    for (let i = 1; i < frames.length; i++) {
      expect(frames[i]!.mse).toBeLessThanOrEqual(frames[i-1]!.mse + 1e-12)
      expect(Number.isFinite(frames[i]!.loss)).toBe(true)
    }
    expect(frames.at(-1)!.mse).toBeLessThan(frames[0]!.mse)
  }
})
