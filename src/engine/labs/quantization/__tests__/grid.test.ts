import {describe,expect,it} from 'vitest'
import {Matrix} from '../../../math/matrix'
import {decodeFloatBits} from '../../../math/ieee754'
import {NF4_CODEBOOK, type QuantMethod} from '../engine'
import {buildQuantGrid} from '../grid'

function sample(method:QuantMethod) {
  const original=Matrix.from2D([[-1,-.5,.5,1],[0,.25,.5,1]])
  return {method,original,dequantized:original,scales:original.map(()=>.25),zeroPoints:original.map(()=>3),channelScales:[1,2,1,1],groupSize:4}
}
describe('histogram and selected local reconstruction grid',()=>{
  it('preserves every observation including the exact upper boundary',()=>{
    const result=buildQuantGrid(sample('int4_group'),1,1,12,300)
    expect(result.bins.reduce((sum,b)=>sum+b.count,0)).toBe(8)
    expect(result.bins.reduce((sum,b)=>sum+b.groupCount,0)).toBe(4)
    expect([result.groupStart,result.groupEnd]).toEqual([4,8])
    expect(result.ticks.map(t=>t.value)).toEqual(Array.from({length:15},(_,i)=>(i-7)*.5))
  })
  it('decodes unsigned affine codes in original units using the selected channel scale',()=>{
    const result=buildQuantGrid(sample('int4_asym'),0,1)
    expect(result.ticks.map(t=>t.value)).toEqual(Array.from({length:16},(_,i)=>(i-3)*.5))
    expect(result.groupEnd).toBe(8)
  })
  it('retains every nonuniform NF4 reconstruction level and a single zero',()=>{
    const grid=buildQuantGrid(sample('nf4'),0,1)
    expect(grid.ticks.map(t=>t.value)).toEqual(NF4_CODEBOOK.map(v=>v*.5))
    expect(grid.ticks.filter(t=>t.value===0)).toHaveLength(1)
  })
  it('produces a finite histogram for all-zero data and a degenerate codebook',()=>{
    const input=sample('int4_sym')
    const zeros=input.original.map(()=>0)
    const grid=buildQuantGrid({...input,original:zeros,dequantized:zeros,scales:zeros},0,0)
    expect(grid.min).toBeLessThan(grid.max)
    expect(grid.levelCount).toBe(1)
    expect(grid.bins.find(b=>b.low<=0&&b.high>0)?.count).toBe(8)
  })
  it('coalesces dense FP16 ticks without omitting codes or including infinities',()=>{
    const grid=buildQuantGrid(sample('fp16'),0,1,24,32)
    const exact=new Set(Array.from({length:65536},(_,bits)=>decodeFloatBits(bits,'fp16')*2)
      .filter(v=>Number.isFinite(v)&&v>=grid.min&&v<=grid.max))
    expect(grid.levelCount).toBe(exact.size)
    expect(grid.ticks.length).toBeLessThanOrEqual(32)
    expect(grid.ticks.reduce((sum,t)=>sum+t.count,0)).toBe(exact.size)
    for(const t of grid.ticks) {
      expect(exact.has(t.low)&&exact.has(t.high)&&exact.has(t.value)).toBe(true)
      expect(t.count).toBe([...exact].filter(v=>v>=t.low&&v<=t.high).length)
    }
  })
  it('shows the precise FP8 subnormal and signed levels when the grid is resolvable',()=>{
    const grid=buildQuantGrid(sample('fp8_e4m3'),0,0,8,4096)
    const exact=new Set(Array.from({length:256},(_,bits)=>decodeFloatBits(bits,'fp8_e4m3'))
      .filter(v=>Number.isFinite(v)&&v>=grid.min&&v<=grid.max))
    expect(grid.ticks.map(t=>t.value)).toEqual([...exact].sort((a,b)=>a-b))
  })
})
