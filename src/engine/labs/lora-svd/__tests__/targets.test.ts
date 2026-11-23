import { describe, expect, it } from 'vitest'
import { makeLoraTarget, rankApproximation, type TargetPreset } from '../targets'
import { mse } from '../../../math/matrix'
const presets:TargetPreset[]=['low-rank','attention-shift','full-rank']

describe('weight updates and optimal low-rank limits',()=>{
  it.each(presets)('recovers %s to double precision at full rank',preset=>{
    const t=makeLoraTarget(preset)
    expect(t.delta.rows).toBe(16);expect(t.delta.cols).toBe(16)
    const full=rankApproximation(t,16)
    expect(full.optimal.sub(t.delta).frobeniusNorm()).toBeLessThan(1e-8)
    expect(full.svdFloorMse).toBe(0);expect(full.explainedEnergy).toBeCloseTo(1,13)
    const floors=Array.from({length:17},(_,r)=>rankApproximation(t,r))
    for(let r=0;r<=16;r++){
      const approximation=floors[r]!
      expect(mse(approximation.optimal.data,t.delta.data)).toBeCloseTo(approximation.svdFloorMse,11)
      if(r)expect(approximation.svdFloorMse).toBeLessThanOrEqual(floors[r-1]!.svdFloorMse)
    }
  })
  it('distinguishes a low-rank task, six-mode attention shift and full-rank noise',()=>{
    const low=makeLoraTarget('low-rank'),shift=makeLoraTarget('attention-shift'),noise=makeLoraTarget('full-rank')
    expect(rankApproximation(low,3).explainedEnergy).toBeGreaterThan(.95)
    expect(rankApproximation(shift,4).explainedEnergy).toBeLessThan(.95)
    expect(rankApproximation(shift,6).explainedEnergy).toBeGreaterThan(.99)
    expect(noise.svd.S.every(s=>s>1e-9)).toBe(true)
    expect(rankApproximation(noise,2).explainedEnergy).toBeLessThan(.35)
  })
  it('reproduces the seeded task without overwriting the frozen base',()=>{
    const first=makeLoraTarget('low-rank',17)
    expect(first.delta.to2D()).toEqual(makeLoraTarget('low-rank',17).delta.to2D())
    expect(first.delta.to2D()).not.toEqual(makeLoraTarget('low-rank',18).delta.to2D())
    expect(first.base.to2D()).toEqual(makeLoraTarget('full-rank',17).base.to2D())
    const before=first.base.to2D()
    rankApproximation(first,2)
    expect(first.base.to2D()).toEqual(before)
  })
})
