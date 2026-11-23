import { expect,it } from 'vitest'
import { learningRateAt } from '../schedule'

it('keeps constant LR fixed and cosine monotone with the exact initial and terminal rates',()=>{
  const peak=.1,min=.004
  const rates=Array.from({length:101},(_,s)=>learningRateAt('cosine',peak,s,100,10,min))
  expect(rates[0]).toBeCloseTo(peak,15)
  expect(rates[100]).toBeCloseTo(min,15)
  expect(rates[50]).toBeCloseTo((peak+min)/2,15)
  expect(rates.slice(1).every((r,i)=>r<rates[i]!)).toBe(true)
  for(const s of [0,10,100])expect(learningRateAt('constant',peak,s,100)).toBe(peak)
})
it('linearly warms up from zero, peaks once, then decays monotonically to the positive floor',()=>{
  const all=Array.from({length:101},(_,s)=>learningRateAt('warmup-cosine',.1,s,100,10,.002))
  expect(all[0]).toBe(0)
  expect(all[5]).toBeCloseTo(.05,15)
  expect(all[10]).toBe(.1)
  expect(all.filter(r=>r===.1)).toHaveLength(1)
  expect(all.slice(11).every((r,i)=>r<all[i+10]!)).toBe(true)
  expect(all[100]).toBe(.002)
})
it('holds both schedule endpoints outside the run and rejects invalid rates',()=>{
  expect(learningRateAt('warmup-cosine',.05,-5,50)).toBe(0)
  expect(learningRateAt('cosine',.05,300,50)).toBeCloseTo(.001,15)
  expect(()=>learningRateAt('cosine',.05,4,20,2,.1)).toThrow(RangeError)
})
