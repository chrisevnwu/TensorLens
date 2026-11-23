import { expect, it } from 'vitest'
import { Matrix } from '../../../math/matrix'
import { naiveAttention, simulateFlash, tileAttention } from '../engine'
import { FLASH_PRESETS } from '../presets'

function reference(Q:Matrix,K:Matrix,V:Matrix,causal:boolean) {
  return Array.from({length:Q.rows},(_,r)=>{
    const logits=Array.from({length:K.rows},(_,c)=>{
      if (causal && c>r) return -Infinity
      let dot=0
      for(let z=0; z<Q.cols; z++) dot+=Q.get(r,z)*K.get(c,z)
      return dot/Math.sqrt(Q.cols)
    })
    const peak=Math.max(...logits)
    const exp=logits.map(score=>Math.exp(score-peak))
    const sum=exp.reduce((a,b)=>a+b,0)
    return Array.from({length:V.cols},(_,z)=>exp.reduce((total,p,j)=>total+p/sum*V.get(j,z),0))
  })
}

it.each([8,12,16])('matches independently normalized rows for every admissible Br/Bc/causal setting, N=%i', seqLen=>{
  const tiles=[2,4,8].filter(b=>seqLen%b===0)
  for(const blockBr of tiles) for(const blockBc of tiles) for(const causalMask of [true,false]) {
    const result=simulateFlash({seqLen,blockBr,blockBc,causalMask})
    const correct=reference(result.Q,result.K,result.V,causalMask)
    let maxError=0
    for(let i=0;i<seqLen;i++) for(let z=0;z<4;z++) {
      expect(Math.abs(result.naiveOutput.get(i,z)-correct[i]![z]!)).toBeLessThan(1e-10)
      expect(Math.abs(result.flashOutput.get(i,z)-correct[i]![z]!)).toBeLessThan(1e-10)
      maxError=Math.max(maxError,Math.abs(result.flashOutput.get(i,z)-result.naiveOutput.get(i,z)))
    }
    expect(result.maxAbsError).toBe(maxError)
    const tileCount=(seqLen/blockBr)*(seqLen/blockBc)
    let skip=0
    for(let i=0;i<seqLen;i+=blockBr) for(let j=0;j<seqLen;j+=blockBc) if(causalMask && j>i+blockBr-1) skip++
    expect(result.skippedTiles).toBe(skip)
    expect(result.trace.filter(f=>f.phase==='skip')).toHaveLength(skip)
    expect(result.trace.filter(f=>f.phase==='compute')).toHaveLength(tileCount-skip)
    const totalReads=seqLen*4+(tileCount-skip)*2*blockBc*4
    const totalWrites=seqLen*4
    expect(result.trace.at(-1)).toMatchObject({reads:totalReads,writes:totalWrites,bytes:2*(totalReads+totalWrites)})
    expect(result.flashBytes).toBe(2*(totalReads+totalWrites))
    expect(result.standardBytes).toBe(2*(4*seqLen*seqLen+4*seqLen*4))
  }
})

it('charges bounded tile transfers to individual phases with zero HBM writes of score or probability tiles',()=>{
  let reads=0,writes=0
  const config=FLASH_PRESETS[2], result=simulateFlash(config)
  for(const frame of result.trace) {
    if(frame.phase==='load-q') reads+=config.blockBr*4
    if(frame.phase==='load-kv') reads+=config.blockBc*4*2
    if(frame.phase==='write') writes+=config.blockBr*4
    expect([frame.reads,frame.writes,frame.bytes]).toEqual([reads,writes,2*(reads+writes)])
  }
  expect(result.skippedTiles).toBe(6)
  expect(result.flashBytes).toBeLessThan(result.standardBytes)
})

it('rescales previous row mass and partial weighted sums when a later key introduces a larger maximum',()=>{
  const q=Matrix.from2D([[2],[1],[3],[4]])
  const k=Matrix.from2D([[-2],[-1],[2],[3]])
  const v=Matrix.from2D([[3],[-1],[7],[9]])
  const result=tileAttention(q,k,v,2,2,false)
  const frame=result.trace.find(f=>f.phase==='compute' && f.i===0 && f.j===1)!
  expect(frame.mBefore).toEqual([-2,-1])
  expect(frame.m).toEqual([6,3])
  expect(frame.alpha[0]).toBeCloseTo(Math.exp(-8),14)
  expect(frame.scores[0]).toEqual([4,6])
  expect(frame.p[0]![0]).toBeCloseTo(Math.exp(-2),14)
  const mass=Math.exp(-10)+Math.exp(-8)+Math.exp(-2)+1
  const accum=3*Math.exp(-10)-Math.exp(-8)+7*Math.exp(-2)+9
  expect(frame.l[0]).toBeCloseTo(mass,13)
  expect(frame.accumulator[0]![0]).toBeCloseTo(accum,13)
  expect(result.flashOutput.get(0,0)).toBeCloseTo(accum/mass,13)
})

it('keeps running denominators and outputs finite for extreme logits, zero scores, and partially masked tiles',()=>{
  const Q=Matrix.from2D([[1000,0],[0,0],[-1000,1],[1,1]])
  const K=Matrix.from2D([[-1000,2],[-500,0],[500,0],[1000,1]])
  const V=Matrix.from2D([[1,3],[4,1],[0,8],[-2,7]])
  for(const causal of [true,false]) {
    const flash=tileAttention(Q,K,V,2,2,causal)
    const naive=naiveAttention(Q,K,V,causal)
    for(const f of flash.trace.filter(f=>f.phase==='compute')) {
      expect([...f.l,...f.alpha,...f.accumulator.flat(),...f.p.flat()].every(Number.isFinite)).toBe(true)
    }
    const expected=reference(Q,K,V,causal)
    for(let i=0;i<4;i++) for(let j=0;j<2;j++) {
      expect(flash.flashOutput.get(i,j)).toBeCloseTo(expected[i]![j]!,11)
      expect(naive.get(i,j)).toBeCloseTo(expected[i]![j]!,11)
    }
  }
})

it('reaches numerical equivalence and decreases K/V reloads when expanding query tiles with all else held fixed',()=>{
  const small=simulateFlash({...FLASH_PRESETS[0],blockBr:2})
  const wide=simulateFlash({...FLASH_PRESETS[0],blockBr:8})
  expect(wide.maxAbsError).toBeLessThan(1e-10)
  expect(wide.trace.at(-1)?.phase).toBe('write')
  const qRead=8*4
  expect(small.trace.at(-1)!.reads-qRead).toBe(4*(wide.trace.at(-1)!.reads-qRead))
  expect(small.Q.to2D()).toEqual(wide.Q.to2D())
  expect(wide).toEqual(simulateFlash({...FLASH_PRESETS[0],blockBr:8}))
})
