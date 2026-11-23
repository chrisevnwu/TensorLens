import { expect,it } from 'vitest'
import { simulateLora } from '../engine'
import { LORA_PRESETS } from '../presets'
import { makeLoraTarget,rankApproximation } from '../targets'

it.each(['low-rank','attention-shift','full-rank'] as const)('reconstructs the full %s target to 1e−8 and gives the true truncated-SVD floor',preset=>{
  const target=makeLoraTarget(preset)
  const full=rankApproximation(target,16)
  expect(full.optimal.sub(target.delta).frobeniusNorm()).toBeLessThan(1e-8)
  expect(full.explainedEnergy).toBeCloseTo(1,12)
  let previousFloor=Infinity
  for(let rank=1;rank<=16;rank++) {
    const result=rankApproximation(target,rank)
    const total=target.svd.S.reduce((a,v)=>a+v*v,0)
    const energy=target.svd.S.slice(0,rank).reduce((a,v)=>a+v*v,0)/total
    expect(result.explainedEnergy).toBeCloseTo(energy,12)
    expect(result.svdFloorMse).toBeCloseTo(result.optimal.sub(target.delta).frobeniusNorm()**2/(16*16),12)
    expect(result.svdFloorMse).toBeLessThanOrEqual(previousFloor)
    previousFloor=result.svdFloorMse
  }
})

it.each([1,2,4,8,16])('counts %i-rank adapter parameters and starts from exact identity relative to the frozen base',rank=>{
  const r=simulateLora({...LORA_PRESETS[0],rank})
  const initial=r.frames[0]!
  expect(r.trainableParams).toBe(32*rank)
  expect(initial.A.rows).toBe(rank); expect(initial.A.cols).toBe(16)
  expect(initial.B.rows).toBe(16); expect(initial.B.cols).toBe(rank)
  expect(initial.B.frobeniusNorm()).toBe(0)
  expect(initial.delta.frobeniusNorm()).toBe(0)
  expect(r.target.base.add(initial.delta).to2D()).toEqual(r.target.base.to2D())
})

it('checks true training residuals against the theoretical lower bound over the full trajectory',()=>{
  const r=simulateLora(LORA_PRESETS[0])
  expect(r.frames).toHaveLength(101)
  for(const [i,frame] of r.frames.entries()) {
    expect(frame.step).toBe(i)
    expect(frame.delta.sub(frame.B.matmul(frame.A).scale(8/4)).frobeniusNorm()).toBeLessThan(1e-10)
    const residual=frame.delta.sub(r.target.delta)
    const trueMse=residual.frobeniusNorm()**2/(16*16)
    expect(frame.residual.sub(residual).frobeniusNorm()).toBeLessThan(1e-10)
    expect(frame.mse).toBeCloseTo(trueMse,11)
    expect(frame.mse+1e-10).toBeGreaterThanOrEqual(r.approximation.svdFloorMse)
  }
  const last=r.frames[100]!
  expect(last.mse).toBeLessThan(r.frames[0]!.mse)
  expect(last.mse).toBeLessThanOrEqual(r.approximation.svdFloorMse*1.15+1e-4)
})

it('uses a reproducible nonzero B for the broken initialization demonstration',()=>{
  const clean=simulateLora(LORA_PRESETS[0])
  const broken=simulateLora(LORA_PRESETS[2])
  expect(clean.target.delta.to2D()).toEqual(broken.target.delta.to2D())
  expect(broken.frames[0]!.B.frobeniusNorm()).toBeGreaterThan(0)
  expect(broken.frames[0]!.delta.frobeniusNorm()).toBeGreaterThan(0)
  expect(broken.frames[0]!.B.to2D()).toEqual(simulateLora(LORA_PRESETS[2]).frames[0]!.B.to2D())
})

it('reaches the energy, floor, and high-rank failure challenges with the actual training and target presets',()=>{
  const r=simulateLora(LORA_PRESETS[0])
  const first=[1,2,3,4].find(rank=>rankApproximation(r.target,rank).explainedEnergy>=.95)
  expect(first).toBeDefined()
  expect(r.frames.some(f=>f.step>=30 && f.mse<=r.approximation.svdFloorMse*1.15+1e-4)).toBe(true)
  expect(simulateLora(LORA_PRESETS[1]).approximation.explainedEnergy).toBeLessThan(.35)
})
