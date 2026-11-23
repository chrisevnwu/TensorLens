import type { HardwareProfile, ModelProfile } from './profiles'

export type AttentionType = 'MHA' | 'GQA' | 'MQA' | 'MLA'
export type KvPrecision = 'FP16' | 'FP8' | 'INT4'

export interface ProfileConfig {
  model: ModelProfile
  hardware: HardwareProfile
  attentionType: AttentionType
  contextLength: number
  batchSize: number
  kvPrecision: KvPrecision
}

interface Phase {
  ai: number
  achievedTflops: number
  flops: number
  bound: 'compute' | 'memory'
}

export interface ProfileResult {
  weightBytes: number
  kvBytes: number
  activationBytes: number
  totalBytes: number
  capacityBytes: number
  isOom: boolean
  baselineKvBytes: number
  kvSavingsRatio: number
  headCount: number
  ridgeAI: number
  singleBatchDecodeAI: number
  decodeAI: number
  prefillAI: number
  ttftMs: number
  tpotMs: number
  tokensPerSecond: number
  perSequenceTokensPerSecond: number
  prefill: Phase
  decode: Phase
}

const bytesPerElement: Record<KvPrecision,number> = { FP16:2, FP8:1, INT4:.5 }

/** Decimal TFLOP/s from FLOP/byte and decimal TB/s. */
export function rooflineTflops(ai: number, hardware: HardwareProfile) {
  return Math.min(hardware.peakTflops, hardware.bandwidthTBs * Math.max(0, ai))
}

function phase(flops: number, ai: number, hardware: HardwareProfile): Phase {
  return { flops, ai, achievedTflops: rooflineTflops(ai,hardware),
    bound: ai >= hardware.peakTflops/hardware.bandwidthTBs ? 'compute' : 'memory' }
}

export function computeProfile(config: ProfileConfig): ProfileResult {
  const { model, hardware, attentionType, batchSize, contextLength, kvPrecision } = config
  const sizes = [batchSize,contextLength,model.layers,model.qHeads,model.kvHeads,model.headDim,model.latentDim,model.ropeDim]
  if (sizes.some(n => !Number.isSafeInteger(n) || n<1) || model.kvHeads>model.qHeads ||
      [model.paramsB,model.weightBytes,hardware.capacityGB,hardware.peakTflops,hardware.bandwidthTBs].some(n=>!Number.isFinite(n)||n<=0)) {
    throw new RangeError('Model, batch and hardware dimensions must be positive')
  }

  const parameters = model.paramsB * 1e9
  const weightBytes = parameters * model.weightBytes
  const headCount = { MHA:model.qHeads, GQA:model.kvHeads, MQA:1, MLA:0 }[attentionType]
  const entriesPerLayer = attentionType === 'MLA' ? model.latentDim+model.ropeDim : 2*headCount*model.headDim
  const singleBatchKvBytes = model.layers * contextLength * entriesPerLayer * bytesPerElement[kvPrecision]
  const kvBytes = batchSize * singleBatchKvBytes
  const baselineKvBytes = model.layers * contextLength * batchSize * 2 * model.qHeads * model.headDim * bytesPerElement.FP16

  // Illustrative peak prefill activation allocation: two simultaneously live BF16 hidden-state buffers.
  const hiddenSize = model.hiddenSize ?? model.qHeads*model.headDim
  const activationBytes = 2 * 2 * hiddenSize * contextLength * batchSize
  const totalBytes = weightBytes + kvBytes + activationBytes
  const capacityBytes = hardware.capacityGB * 1e9
  const prefillAI = batchSize*contextLength/model.weightBytes
  const decodeAI = 2*parameters*batchSize/(weightBytes+kvBytes)
  const singleBatchDecodeAI = 2*parameters/(weightBytes+singleBatchKvBytes)
  // These are dense-equivalent, peak-roof predictions. Work and time refer to all simultaneous sequences.
  const prefill = phase(2*parameters*batchSize*contextLength, prefillAI, hardware)
  const decode = phase(2*parameters*batchSize, decodeAI, hardware)
  const ttftMs = prefill.flops/(prefill.achievedTflops*1e9)
  const tpotMs = decode.flops/(decode.achievedTflops*1e9)
  const perSequenceTokensPerSecond = 1000/tpotMs

  return { weightBytes,kvBytes,activationBytes,totalBytes,capacityBytes,isOom:totalBytes>capacityBytes,
    headCount,baselineKvBytes,kvSavingsRatio:1-kvBytes/baselineKvBytes,ridgeAI:hardware.peakTflops/hardware.bandwidthTBs,
    decodeAI,prefillAI,singleBatchDecodeAI,prefill,decode,ttftMs,tpotMs,perSequenceTokensPerSecond,
    tokensPerSecond:batchSize*perSequenceTokensPerSecond }
}
