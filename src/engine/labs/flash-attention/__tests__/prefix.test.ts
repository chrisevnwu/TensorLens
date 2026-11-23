import { expect, it } from 'vitest'
import { Matrix } from '../../../math/matrix'
import { tileAttention } from '../engine'
import { tiledBytes } from '../io'

it('recovers prefix means for uniform causal scores even when the last row and column tiles are partial', () => {
  const q = Matrix.zeros(5,1)
  const v = Matrix.from2D([[2],[4],[9],[1],[14]])
  const run = tileAttention(q,q,v,3,2,true)
  expect(run.flashOutput.to2D()).toEqual([[2],[3],[5],[4],[6]])
  expect(run.flashBytes).toBe(tiledBytes(5,1,3,2,true))
  expect(run.trace.filter(step => step.phase === 'write')).toHaveLength(2)
})
