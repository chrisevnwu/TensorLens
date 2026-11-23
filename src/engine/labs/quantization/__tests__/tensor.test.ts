import { expect, it } from 'vitest'
import { Matrix } from '../../../math/matrix'
import { generateTensor, NF4_CODEBOOK, quantizeTensor, simulateQuant, type QuantMethod } from '../engine'
import { QUANT_PRESETS } from '../presets'

const clean=QUANT_PRESETS[0]
const methods:QuantMethod[]=['fp16','bf16','fp8_e4m3','int8_sym','int4_sym','int8_asym','int4_asym','int4_group','nf4']

it('uses QLoRA canonical NF4 levels and records the nearest lookup code',()=>{
  expect(NF4_CODEBOOK).toHaveLength(16)
  expect(NF4_CODEBOOK[1]).toBe(-.6961928009986877)
  expect(NF4_CODEBOOK[8]).toBe(.07958029955625534)
  expect(NF4_CODEBOOK[14]).toBe(.7229568362236023)
  const values=[-2,-.69,-.17,0,.16,.5,1.5,2]
  const r=quantizeTensor(Matrix.from2D([values]),{method:'nf4',groupSize:8,smoothAlpha:0})
  for(const [i,x] of values.entries()) {
    const index=NF4_CODEBOOK.reduce((best,v,k)=>Math.abs(v-x/2)<Math.abs(NF4_CODEBOOK[best]!-x/2)?k:best,0 as number)
    expect(r.codes.get(0,i)).toBe(index)
    expect(r.dequantized.get(0,i)).toBe(2*NF4_CODEBOOK[index]!)
  }
})

it('implements exact per-tensor symmetric and affine integer quantization, with signed and unsigned codes',()=>{
  const x=Matrix.from2D([[-4,-2,0,2,3.5]])
  for(const method of ['int4_sym','int8_sym','int4_asym','int8_asym'] as const) {
    const r=quantizeTensor(x,{method,groupSize:8,smoothAlpha:0})
    const bits=method.startsWith('int4')?4:8
    const sym=method.endsWith('_sym')
    const qmax=sym?2**(bits-1)-1:2**bits-1
    const scale=(sym?4:7.5)/qmax
    const zero=sym?0:Math.round(4/scale)
    for(let i=0;i<x.cols;i++) {
      const expected=Math.max(sym?-qmax:0,Math.min(qmax,Math.round(x.get(0,i)/scale)+zero))
      expect(r.codes.get(0,i)).toBe(expected)
      expect(r.scales.get(0,i)).toBeCloseTo(scale,13)
      expect(r.zeroPoints.get(0,i)).toBe(zero)
      expect(r.dequantized.get(0,i)).toBeCloseTo((expected-zero)*scale,12)
    }
  }
})

it('charges group scale storage, channel migration factors, and partially filled tail groups',()=>{
  for(const method of ['int4_group','nf4'] as const) {
    for(const groupSize of [8,16,32,64]) {
      const r=simulateQuant({...clean,method,groupSize})
      expect(r.effectiveBits).toBe(4+16/groupSize)
    }
    const x=Matrix.from2D([[0,1,2,3,4,5,6,7,8,9]])
    expect(quantizeTensor(x,{method,groupSize:8,smoothAlpha:0}).effectiveBits).toBe(4+32/10)
  }
  const raw=simulateQuant({...clean,method:'int4_group'})
  expect(simulateQuant({...clean,method:'int4_group',smoothAlpha:.5}).effectiveBits-raw.effectiveBits).toBe(1)
})

it.each(methods)('%s reports metrics from actual reconstructed values, including smooth migration back to original units',method=>{
  const r=simulateQuant({...clean,method,outlierMag:15,smoothAlpha:.6})
  let signal=0,noise=0,cross=0,reconPower=0,peak=0
  for(let i=0;i<r.original.data.length;i++) {
    const x=r.original.data[i]!, y=r.dequantized.data[i]!, difference=x-y
    expect(r.errors.data[i]).toBeCloseTo(Math.abs(difference),13)
    peak=Math.max(peak,Math.abs(difference))
    signal+=x*x; noise+=difference*difference; cross+=x*y; reconPower+=y*y
  }
  expect(r.maxAbsError).toBeCloseTo(peak,12)
  expect(r.mse).toBeCloseTo(noise/r.original.data.length,12)
  expect(r.sqnrDb).toBeCloseTo(10*Math.log10(signal/noise),10)
  expect(r.cosineSimilarity).toBeCloseTo(cross/Math.sqrt(signal*reconPower),12)
  for(let j=0;j<16;j++) {
    const peak=Math.max(...Array.from({length:16},(_,i)=>Math.abs(r.original.get(i,j))))
    expect(r.channelScales[j]).toBeCloseTo(peak**.6,11)
  }
})

it.each(methods)('remains finite on zeros, a constant sign, and a one-element group (%s)',method=>{
  for(const x of [Matrix.zeros(2,3),Matrix.from2D([[-2.5]]),Matrix.from2D([[2,3,4]]),Matrix.from2D([[-4,-3,-2]])]) {
    const r=quantizeTensor(x,{method,groupSize:8,smoothAlpha:0})
    expect([...r.dequantized.data,...r.scales.data,...r.errors.data,r.mse,r.sqnrDb,r.cosineSimilarity,r.effectiveBits].every(Number.isFinite)).toBe(true)
    if (x.data.every(v=>v===0)) expect(r.dequantized.data.every(v=>v===0)).toBe(true)
  }
})

it('constructs reproducible standard Gaussian weights and injects two sparse spikes in distinct channels',()=>{
  const x=generateTensor(0,42), y=generateTensor(20,42)
  const differences=Array.from(y.data,(v,i)=>({index:i,delta:v-x.data[i]!})).filter(d=>d.delta!==0)
  expect(x.rows).toBe(16); expect(x.cols).toBe(16)
  expect(generateTensor(0,42).to2D()).toEqual(x.to2D())
  expect(generateTensor(0,77).to2D()).not.toEqual(x.to2D())
  expect(differences).toHaveLength(2)
  expect(new Set(differences.map(d=>d.index%16)).size).toBe(2)
  expect(differences.map(d=>Math.sign(d.delta)).sort()).toEqual([-1,1])
  differences.forEach(d=>expect(Math.abs(d.delta)).toBeCloseTo(20,12))
})

it('improves clean Gaussian SQNR with INT8 or NF4 over per-tensor INT4',()=>{
  const int4=simulateQuant(clean)
  expect(simulateQuant({...clean,method:'int8_sym'}).sqnrDb).toBeGreaterThan(int4.sqnrDb)
  expect(simulateQuant({...clean,method:'nf4'}).sqnrDb).toBeGreaterThan(int4.sqnrDb)
})

it('clean and outlier group sweeps use measured MSE, strictly improving when shrinking INT4 groups under outliers',()=>{
  for(const outlierMag of [0,20]) {
    const sweep=[64,32,16,8].map(groupSize=>simulateQuant({...clean,method:'int4_group',groupSize,outlierMag}).mse)
    for(let i=1;i<sweep.length;i++) {
      expect(sweep[i]).toBeLessThanOrEqual(sweep[i-1]!+1e-14)
      if(outlierMag) expect(sweep[i]).toBeLessThan(sweep[i-1]!)
    }
  }
})

it('achieves both tensor challenges on the same spiked tensor with real global SQNR and cosine',()=>{
  const baseline=simulateQuant(QUANT_PRESETS[1]), recovered=simulateQuant(QUANT_PRESETS[2])
  expect(baseline.original.to2D()).toEqual(recovered.original.to2D())
  expect(baseline.sqnrDb).toBeLessThan(10)
  expect(recovered.sqnrDb).toBeGreaterThanOrEqual(18)
  expect(recovered.cosineSimilarity).toBeGreaterThanOrEqual(.99)
})
