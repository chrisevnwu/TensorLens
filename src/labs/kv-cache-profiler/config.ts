import { choiceField, makeUrlCodec, numberField, type UrlStateCodec } from '../../components/utils/useLabUrlState'
import { HARDWARE_PROFILES, MODEL_PROFILES, type ModelProfile } from '../../engine/labs/kv-cache-profiler/profiles'
import type { AttentionType, KvPrecision } from '../../engine/labs/kv-cache-profiler/engine'

export const attentionTypes: AttentionType[] = ['MHA','GQA','MQA','MLA']
export const precisions: KvPrecision[] = ['FP16','FP8','INT4']
export const modes = ['both','cached','uncached'] as const
export const scenarios = ['single','batch','latent'] as const
type Scenario = typeof scenarios[number]
type ModelId = typeof MODEL_PROFILES[number]['id']
type HardwareId = typeof HARDWARE_PROFILES[number]['id']
export interface KvState {
  preset:Scenario; modelId:ModelId; hardwareId:HardwareId; mode:typeof modes[number]; attentionType:AttentionType
  contextLength:number; batchSize:number; kvPrecision:KvPrecision; step:number
  paramsB:number; layers:number; qHeads:number; kvHeads:number; headDim:number
  latentDim:number; ropeDim:number; hiddenSize:number; weightBytes:number
}

export function scenario(preset:Scenario):KvState {
  const result:KvState = {preset,modelId:'llama8',hardwareId:'h100',mode:'both',attentionType:'GQA',contextLength:8192,batchSize:1,kvPrecision:'FP16',step:0,
    paramsB:8,layers:32,qHeads:32,kvHeads:8,headDim:128,latentDim:512,ropeDim:64,hiddenSize:0,weightBytes:2}
  if (preset==='batch') return {...result,attentionType:'MHA',contextLength:32768,batchSize:8}
  if (preset==='latent') return {...result,modelId:'deepseek',attentionType:'MLA',kvPrecision:'FP8'}
  return result
}
export const initial = scenario('single')
export const customRanges = {
  paramsB:[.1,1000,.1], layers:[1,160,1], qHeads:[1,256,1], kvHeads:[1,256,1],
  headDim:[1,512,1], latentDim:[1,4096,1], ropeDim:[1,512,1], hiddenSize:[0,65536,1],
} as const
export function normalize(state:KvState):KvState {
  // Valid grouped-query layouts assign an integral number of query heads per KV group.
  let kvHeads = Math.min(state.kvHeads,state.qHeads)
  while (state.qHeads % kvHeads !== 0) kvHeads--
  return {...state,kvHeads}
}
const fields=makeUrlCodec<KvState>({
  preset:choiceField(scenarios),modelId:choiceField(MODEL_PROFILES.map(p=>p.id)),hardwareId:choiceField(HARDWARE_PROFILES.map(p=>p.id)),
  mode:choiceField(modes),attentionType:choiceField(attentionTypes),contextLength:numberField(512,131072,1),
  batchSize:numberField(1,64,1),kvPrecision:choiceField(precisions),step:numberField(0,8,1),
  paramsB:numberField(...customRanges.paramsB),layers:numberField(...customRanges.layers),qHeads:numberField(...customRanges.qHeads),
  kvHeads:numberField(...customRanges.kvHeads),headDim:numberField(...customRanges.headDim),latentDim:numberField(...customRanges.latentDim),
  ropeDim:numberField(...customRanges.ropeDim),hiddenSize:numberField(...customRanges.hiddenSize),weightBytes:choiceField<number>([.5,1,2,4]),
})
export const codec:UrlStateCodec<KvState> = {
  encode:fields.encode,
  decode(params) {
    const selected=scenarios.find(p=>p===params.get('preset')) ?? 'single'
    return normalize(fields.decode(params,scenario(selected)))
  },
}

export function selectedModel(s:KvState):ModelProfile {
  const profile=MODEL_PROFILES.find(p=>p.id===s.modelId) ?? MODEL_PROFILES[0]
  if (profile.id!=='custom') return profile
  return {...profile,paramsB:s.paramsB,layers:s.layers,qHeads:s.qHeads,kvHeads:s.kvHeads,headDim:s.headDim,
    latentDim:s.latentDim,ropeDim:s.ropeDim,weightBytes:s.weightBytes,hiddenSize:s.hiddenSize || s.qHeads*s.headDim}
}
