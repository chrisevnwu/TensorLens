import { expect, it } from 'vitest'
import { Matrix } from '../../../math/matrix'
import { tileAttention } from '../engine'

it('rescales the previously accumulated numerator and denominator when a later tile has a larger maximum', () => {
  const run = tileAttention(Matrix.from2D([[1],[1],[1]]), Matrix.from2D([[-2],[0],[2]]), Matrix.from2D([[-1],[4],[9]]), 2, 1, false)
  const compute = run.trace.filter(frame => frame.i === 0 && frame.phase === 'compute')
  expect(compute[0]!.m).toEqual([-2,-2])
  expect(compute[0]!.l).toEqual([1,1])
  expect(compute[0]!.accumulator).toEqual([[-1],[-1]])
  const second = compute[1]!
  expect(second.mBefore).toEqual([-2,-2])
  expect(second.m).toEqual([0,0])
  expect(second.alpha[0]).toBeCloseTo(Math.exp(-2), 14)
  expect(second.accumulator[0]![0]).toBeCloseTo(4 - Math.exp(-2), 14)
  expect(second.l[0]).toBeCloseTo(1 + Math.exp(-2), 14)
  expect(run.flashOutput.get(0,0)).toBeCloseTo((9 + 4 * Math.exp(-2) - Math.exp(-4)) / (1 + Math.exp(-2) + Math.exp(-4)), 12)
})
