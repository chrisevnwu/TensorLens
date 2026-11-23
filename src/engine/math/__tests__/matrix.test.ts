import { expect, it } from 'vitest'
import {
  Matrix, cosineSimilarity, dotProduct, layerNormVector, logSumExp, mse, rmsNormVector,
  shannonEntropy, sqnrDb, stableSoftmax,
} from '../matrix'
import { createRng } from '../prng'

it('composes rectangular matrix operations without mutating inputs', () => {
  const a = Matrix.from2D([[1, 2, 3], [4, 5, 6]])
  expect(a.matmul(a.transpose()).to2D()).toEqual([[14, 32], [32, 77]])
  expect(a.add(a).sub(a.scale(2)).frobeniusNorm()).toBe(0)
  expect(a.map((v, row, col) => v + row + col).to2D()).toEqual([[1, 3, 5], [5, 7, 9]])
  expect(Matrix.identity(2).matmul(a).data).toEqual(a.data)
  const copy = a.clone()
  copy.set(0, 0, 42)
  expect(a.get(0, 0)).toBe(1)
  expect([...a.row(1)]).toEqual([4, 5, 6])
  expect(() => a.get(0, 3)).toThrow(RangeError)
  expect(() => a.matmul(a)).toThrow(RangeError)
  expect(() => a.add(Matrix.zeros(3, 2))).toThrow(RangeError)
  expect(() => Matrix.from2D([[1], []])).toThrow(RangeError)
  expect(Matrix.randomNormal(4, 3, createRng(9)).data).toEqual(Matrix.randomNormal(4, 3, createRng(9)).data)
})

it('normalizes extreme logits without leaking probability into masked cells', () => {
  expect(stableSoftmax([10000, 10000, -Infinity])).toEqual([0.5, 0.5, 0])
  expect(stableSoftmax([-Infinity, -Infinity])).toEqual([0, 0])
  expect(stableSoftmax([1e100, -1e100], 1e-300)).toEqual([1, 0])
  expect(stableSoftmax([Infinity, 0, Infinity])).toEqual([0.5, 0, 0.5])
  expect(stableSoftmax([])).toEqual([])
  expect(logSumExp([-6000, -6000])).toBeCloseTo(-6000 + Math.log(2), 12)
  expect(logSumExp([-Infinity])).toBe(-Infinity)
  expect(shannonEntropy([0.25, 0.25, 0.25, 0.25, 0])).toBe(2)
})

it('normalizes offsets and scale and defines finite zero-vector diagnostics', () => {
  const x = [1, 2, 3]
  const layer = layerNormVector(x)
  expect(layer.mean).toBe(2)
  expect(layer.variance).toBeCloseTo(2 / 3, 12)
  expect(layer.out.reduce((a, b) => a + b, 0)).toBeCloseTo(0, 12)
  expect(dotProduct(layer.out, layer.out) / 3).toBeCloseTo(1, 8)
  const rms = rmsNormVector(x)
  expect(rms.rms).toBeCloseTo(Math.sqrt(14 / 3), 12)
  expect(dotProduct(rms.out, rms.out) / 3).toBeCloseTo(1, 8)
  expect(layerNormVector([4, 4]).out).toEqual([0, 0])
  expect(rmsNormVector([0, 0]).out).toEqual([0, 0])
  expect(cosineSimilarity([0], [0])).toBe(0)
  expect(cosineSimilarity([1e200], [-1e200])).toBe(-1)
  expect(mse([1, 1], [0, 2])).toBe(1)
  expect(sqnrDb([10, 10], [9, 9])).toBeCloseTo(20, 12)
  expect(Number.isFinite(sqnrDb(x, x))).toBe(true)
  expect(Number.isFinite(sqnrDb([0], [0]))).toBe(true)
})
