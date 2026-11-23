import { expect,it } from 'vitest'
import { fieldGrid,scheduleSeries } from '../grid'

it('samples all 256 cell centers and retains the actual (unscaled) flow velocities',()=>{
  const target=[{x:1,y:-.5,label:0 as const}]
  const vectors=fieldGrid(target,'flow',0,'cosine','all',1)
  expect(vectors).toHaveLength(256)
  expect(new Set(vectors.map(v=>v.x)).size).toBe(16)
  expect(new Set(vectors.map(v=>v.y)).size).toBe(16)
  for(const v of vectors){
    expect(v.dx).toBeCloseTo(1-v.x,12)
    expect(v.dy).toBeCloseTo(-.5-v.y,12)
    expect(v.magnitude).toBeCloseTo(Math.hypot(v.dx,v.dy),12)
  }
})
it.each(['linear','cosine'] as const)('reports the true log SNR, with the infinite clean endpoint separated on the %s chart',schedule=>{
  const curve=scheduleSeries(schedule)
  expect(curve).toHaveLength(101)
  expect(curve[0]).toEqual({t:0,alphaBar:1,logSnr:null})
  for(const p of curve.slice(1)){
    expect(p.logSnr).toBeCloseTo(Math.log(p.alphaBar/(1-p.alphaBar)),11)
    expect(Number.isFinite(p.logSnr)).toBe(true)
  }
  const target=[{x:.8,y:-.2,label:0 as const}]
  const a=curve[50]!.alphaBar, variance=(1-a)+a*.06**2
  const sample=fieldGrid(target,'ddim',.5,schedule,'all',2,2,4)[6]!
  expect(sample.dx).toBeCloseTo((Math.sqrt(a)*.8-sample.x)/variance,10)
  expect(sample.dy).toBeCloseTo((Math.sqrt(a)*(-.2)-sample.y)/variance,10)
})
