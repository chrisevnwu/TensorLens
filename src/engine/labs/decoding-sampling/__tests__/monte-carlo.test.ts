import {describe,expect,it} from 'vitest'
import {sampleMonteCarlo} from '../monte-carlo'

describe('deterministic categorical sampling',()=>{
  it('replays a 1× draw followed by 100× exactly and leaves the checkpoint untouched',()=>{
    const p=[.15,0,.35,.5]
    const first=sampleMonteCarlo(p,1,73)
    const checkpoint=JSON.parse(JSON.stringify(first))
    expect(sampleMonteCarlo(p,100,73,checkpoint)).toEqual(sampleMonteCarlo(p,101,73))
    expect(first.cursor).toBe(1)
    expect(first.counts.reduce((a,b)=>a+b,0)).toBe(1)
  })
  it('converges to the known distribution without ever drawing masked tokens',()=>{
    const p=[0,.1,.2,0,.7,0]
    const result=sampleMonteCarlo(p,80000,42)
    expect(result.counts.reduce((a,b)=>a+b,0)).toBe(80000)
    p.forEach((expected,i)=>{
      expect(Math.abs(result.frequencies[i]!-expected)).toBeLessThan(.008)
      if(!expected) expect(result.counts[i]).toBe(0)
    })
    expect(sampleMonteCarlo(p,200,19).counts).not.toEqual(sampleMonteCarlo(p,200,42).counts)
  })
  it('preserves a single survivor, including leading and trailing masked positions',()=>{
    const p=[0,0,1,0]
    const result=sampleMonteCarlo(p,401)
    expect(result.counts).toEqual([0,0,401,0])
    expect(result.lastIndex).toBe(2)
    expect(result.lastDraw).toBeGreaterThanOrEqual(0)
    expect(result.lastDraw).toBeLessThan(1)
  })
  it('resets with zero draws, and validates distributions, count, and checkpoints',()=>{
    const p=[.3,.7]
    expect(sampleMonteCarlo(p,0)).toMatchObject({cursor:0,lastIndex:null,lastDraw:null,counts:[0,0],frequencies:[0,0]})
    for(const invalid of [[],[0,0],[Infinity,1],[-.1,1.1],[NaN,1]]) expect(()=>sampleMonteCarlo(invalid,10)).toThrow()
    for(const n of [-1,1.3,Infinity]) expect(()=>sampleMonteCarlo(p,n)).toThrow()
    expect(()=>sampleMonteCarlo(p,1,4,sampleMonteCarlo(p,3,9))).toThrow()
    expect(()=>sampleMonteCarlo(p,1,4,sampleMonteCarlo([.6,.4],3,4))).toThrow()
  })
})
