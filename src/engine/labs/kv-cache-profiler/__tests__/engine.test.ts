import { expect, it } from 'vitest'
import { computeProfile, rooflineTflops, type ProfileConfig } from '../engine'
import type { HardwareProfile, ModelProfile } from '../profiles'

const model: ModelProfile = {id:'custom',label:'Test',paramsB:8,layers:32,qHeads:32,kvHeads:8,headDim:128,latentDim:512,ropeDim:64,weightBytes:2}
const hardware: HardwareProfile = {id:'h100',label:'Test',capacityGB:80,peakTflops:989,bandwidthTBs:3.35}
const base: ProfileConfig = {model,hardware,attentionType:'MHA',contextLength:8192,batchSize:1,kvPrecision:'FP16'}

it.each(['MHA','GQA','MQA','MLA'] as const)('counts KV storage and its linear dependencies exactly for %s', attentionType => {
  const config = {...base,attentionType}
  const first = computeProfile(config)
  const width = attentionType==='MLA' ? 512+64 : 2*({MHA:32,GQA:8,MQA:1}[attentionType])*128
  expect(first.kvBytes).toBe(32*8192*width*2)
  expect(computeProfile({...config,batchSize:2}).kvBytes).toBe(2*first.kvBytes)
  expect(computeProfile({...config,contextLength:16384}).kvBytes).toBe(2*first.kvBytes)
  expect(computeProfile({...config,model:{...model,layers:64}}).kvBytes).toBe(2*first.kvBytes)
  expect(computeProfile({...config,kvPrecision:'FP8'}).kvBytes).toBe(first.kvBytes/2)
  expect(computeProfile({...config,kvPrecision:'INT4'}).kvBytes).toBe(first.kvBytes/4)
})

it('compares equal-context baselines, reduces physical KV heads, and reaches the capacity rescue threshold', () => {
  const runs = (['MHA','GQA','MQA'] as const).map(attentionType=>computeProfile({...base,attentionType}))
  expect(runs.map(x=>x.headCount)).toEqual([32,8,1])
  expect(runs[0]!.kvBytes).toBeGreaterThan(runs[1]!.kvBytes)
  expect(runs[1]!.kvBytes).toBeGreaterThan(runs[2]!.kvBytes)
  for (const attentionType of ['GQA','MLA'] as const) {
    const optimized = computeProfile({...base,attentionType,kvPrecision:'FP8',batchSize:4})
    expect(optimized.baselineKvBytes).toBe(runs[0]!.kvBytes*4)
    expect(optimized.kvSavingsRatio).toBe(1-optimized.kvBytes/optimized.baselineKvBytes)
    expect(optimized.kvSavingsRatio).toBeGreaterThanOrEqual(.75)
  }
})

it('uses decimal capacity and explicit peak intermediate buffers, with OOM only when total exceeds capacity', () => {
  const r = computeProfile(base)
  expect(r.weightBytes).toBe(16e9)
  expect(r.activationBytes).toBe(2*2*1*8192*32*128)
  expect(r.totalBytes).toBe(r.weightBytes+r.activationBytes+r.kvBytes)
  expect(r.capacityBytes).toBe(80e9)
  expect(computeProfile({...base,hardware:{...hardware,capacityGB:r.totalBytes/1e9}}).isOom).toBe(false)
  expect(computeProfile({...base,batchSize:64,contextLength:131072}).isOom).toBe(true)
})

it('calculates arithmetic intensities, latency, and simultaneous batch throughput in consistent units', () => {
  const count=8
  const r=computeProfile({...base,batchSize:count})
  expect(r.prefillAI).toBe(count*8192/2)
  expect(r.decodeAI).toBe(2*8e9*count/(16e9+r.kvBytes))
  expect(r.ridgeAI).toBeCloseTo(989/3.35,11)
  expect(r.singleBatchDecodeAI).toBe(computeProfile(base).decodeAI)
  expect(r.prefill.flops).toBe(2*8e9*count*8192)
  expect(r.decode.flops).toBe(2*8e9*count)
  expect(r.ttftMs).toBeCloseTo(1000*r.prefill.flops/(r.prefill.achievedTflops*1e12),10)
  expect(r.tpotMs).toBeCloseTo(1000*r.decode.flops/(r.decode.achievedTflops*1e12),10)
  expect(r.perSequenceTokensPerSecond*r.tpotMs).toBeCloseTo(1000,9)
  expect(r.tokensPerSecond/r.perSequenceTokensPerSecond).toBe(count)
  expect(r.prefill.bound).toBe('compute')
  expect(r.decode.bound).toBe('memory')
})

it('clamps achieved throughput to the roof on both sides of the knee and meets the batch challenge on short contexts', () => {
  for (const intensity of [0,.01,1,10,hardware.peakTflops/hardware.bandwidthTBs,1000,1e6]) {
    expect(rooflineTflops(intensity,hardware)).toBe(Math.min(hardware.peakTflops,hardware.bandwidthTBs*intensity))
  }
  const r = computeProfile({...base,batchSize:32,contextLength:512,attentionType:'GQA',kvPrecision:'FP8'})
  expect(r.decodeAI/r.singleBatchDecodeAI).toBeGreaterThan(10)
  expect(r.decode.achievedTflops).toBe(rooflineTflops(r.decodeAI,hardware))
  expect(r.prefill.achievedTflops).toBe(rooflineTflops(r.prefillAI,hardware))
})
