import { describe, expect, it } from 'vitest'
import { Matrix } from '../matrix'
import { createRng } from '../prng'
import { computeSVD, reconstructRankR } from '../svd'

describe('one-sided Jacobi SVD', () => {
  it.each([
    ['square', Matrix.randomNormal(16, 16, createRng(8))],
    ['tall', Matrix.randomNormal(7, 3, createRng(104))],
    ['wide', Matrix.randomNormal(3, 7, createRng(105))],
    ['dependent columns', Matrix.from2D([[2, 4, 0], [3, 6, 0], [4, 8, 0], [5, 10, 0]])],
    ['zero', Matrix.zeros(5, 3)], ['empty', Matrix.zeros(0, 4)],
  ] as const)('reconstructs %s matrices with orthonormal singular vectors', (_, a) => {
    const result = computeSVD(a)
    const k = Math.min(a.cols, a.rows)
    expect(result.S).toHaveLength(k)
    expect(result.S).toEqual([...result.S].sort((x, y) => y - x))
    expect(result.S.every(x => x >= 0)).toBe(true)
    expect([result.U.rows, result.U.cols, result.V.rows, result.V.cols]).toEqual([a.rows, k, a.cols, k])
    expect(result.U.transpose().matmul(result.U).sub(Matrix.identity(k)).frobeniusNorm()).toBeLessThan(1e-10)
    expect(result.V.transpose().matmul(result.V).sub(Matrix.identity(k)).frobeniusNorm()).toBeLessThan(1e-10)
    expect(reconstructRankR(result, k).sub(a).frobeniusNorm()).toBeLessThan(1e-8)
    expect(result.totalEnergy).toBeCloseTo(a.frobeniusNorm() ** 2, 8)
    expect(computeSVD(a).U.data).toEqual(result.U.data)
  })

  it('discards the smallest singular values first', () => {
    const a = Matrix.from2D([[0, 3, 0], [4, 0, 0], [0, 0, -2]])
    const result = computeSVD(a)
    expect(result.S).toEqual([4, 3, 2])
    expect(reconstructRankR(result, 0).frobeniusNorm()).toBe(0)
    expect(reconstructRankR(result, 2).sub(a).frobeniusNorm()).toBe(2)
    expect(reconstructRankR(result, 1).sub(a).frobeniusNorm()).toBeCloseTo(Math.sqrt(13), 11)
  })
})
