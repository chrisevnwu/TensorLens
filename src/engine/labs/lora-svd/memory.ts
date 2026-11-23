export const MODEL_SIZES = [7,14,32,70] as const
export type ModelSize = typeof MODEL_SIZES[number]
export type TrainingMethod = 'full'|'lora'|'qlora'

// Illustrative dense size classes. Parameter totals are independent of the simplified
// Q/V projection geometry used to estimate adapter and activation storage.
const profiles:Record<ModelSize,{hidden:number;layers:number}>={
  7:{hidden:4096,layers:32},14:{hidden:5120,layers:40},
  32:{hidden:5120,layers:64},70:{hidden:8192,layers:80},
}
export interface MemoryRow {
  method:TrainingMethod
  trainable:number
  baseBytes:number
  adapterBytes:number
  gradientBytes:number
  optimizerBytes:number
  activationBytes:number
  totalBytes:number
}
export interface MemoryComparison {
  sizeB:ModelSize
  rank:number
  layers:number
  hidden:number
  sequenceLength:number
  rows:[MemoryRow,MemoryRow,MemoryRow]
  savings:number
}

export function memoryComparison(sizeB:ModelSize,rank:number):MemoryComparison {
  if (!profiles[sizeB] || !Number.isSafeInteger(rank) || rank<1) throw new RangeError('Invalid memory model')
  const {layers,hidden}=profiles[sizeB]
  const sequenceLength=2048
  const parameters=sizeB*1e9
  // Two square target projections (Q,V) per layer, each with two low-rank factors.
  const adapters=2*layers*rank*(hidden+hidden)
  // One microbatch, two retained BF16 hidden states per layer.
  const activationBytes=2*2*sequenceLength*hidden*layers
  function row(method:TrainingMethod):MemoryRow {
    const trainable=method==='full'?parameters:adapters
    // NF4 base has one FP16 absmax scale per 64-parameter block.
    const baseBytes=method==='qlora'?Math.ceil(parameters/2)+2*Math.ceil(parameters/64):2*parameters
    const trainableWidth=method==='lora'?4:2
    const adapterBytes=method==='full'?0:adapters*trainableWidth
    const gradientBytes=trainable*trainableWidth
    const optimizerBytes=trainable*(trainableWidth===4?8:12)
    const totalBytes=baseBytes+adapterBytes+gradientBytes+optimizerBytes+activationBytes
    return {method,trainable,baseBytes,adapterBytes,gradientBytes,optimizerBytes,activationBytes,totalBytes}
  }
  const rows:MemoryComparison['rows']=[row('full'),row('lora'),row('qlora')]
  return {sizeB,rank,layers,hidden,sequenceLength,rows,savings:1-rows[2].totalBytes/rows[0].totalBytes}
}
