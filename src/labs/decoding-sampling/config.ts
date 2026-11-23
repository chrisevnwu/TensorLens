import { booleanField,choiceField,makeUrlCodec,numberField,type UrlStateCodec } from '../../components/utils/useLabUrlState'
import { SAMPLE_CONTEXTS,SAMPLING_PRESETS,type SampleContextId,type SamplePresetId } from '../../engine/labs/decoding-sampling/presets'

export const modes=['sampling','beam'] as const
export const maxDraws=1000000
export interface State {
  preset:SamplePresetId;context:SampleContextId;mode:typeof modes[number]; custom:boolean; customLogits:string
  temperature:number;topK:number;topP:number;minP:number;greedy:boolean; repetitionPenalty:number;frequencyPenalty:number;presencePenalty:number
  beamWidth:number;lengthPenalty:number;step:number;selectedToken:number;node:number;seenGreedy:boolean;seed:number;draws:number
}
export function presetState(id:SamplePresetId):State {
  const {id:preset,...cfg}=SAMPLING_PRESETS.find(p=>p.id===id)??SAMPLING_PRESETS[0]
  return {...cfg,preset,custom:false,customLogits:SAMPLE_CONTEXTS[cfg.context].logits.join(','),step:0,selectedToken:0,node:0,seed:42,draws:0,seenGreedy:false}
}
export function normalize(s:State) {
  const step=Math.min(s.step,s.mode==='beam'?3:5)
  return {...s,step,seenGreedy:s.seenGreedy||(s.mode==='beam'&&s.beamWidth===1&&step===3)}
}
const widths=[1,2,3,4]
function parseLogits(text:string,fallback:string){
  const values=text.split(',')
  if(values.length!==16||values.some(v=>!v.trim()||!Number.isFinite(Number(v)))) return fallback
  return values.map(v=>Math.max(-12,Math.min(12,Number(v)))).join(',')
}
export const initial=presetState('factual')
const fields=makeUrlCodec<State>({
  preset:choiceField(SAMPLING_PRESETS.map(p=>p.id)),context:choiceField(['factual','story','code']),mode:choiceField(modes),custom:booleanField,customLogits:parseLogits,
  temperature:numberField(.05,2.5,.05),topK:numberField(1,16,1),topP:numberField(.1,1,.01),minP:numberField(0,.5,.01),
  repetitionPenalty:numberField(1,2,.05),frequencyPenalty:numberField(-2,2,.05),presencePenalty:numberField(-2,2,.05),greedy:booleanField,
  beamWidth:choiceField(widths),lengthPenalty:numberField(0,1.5,.05),step:numberField(0,5,1),selectedToken:numberField(0,15,1),node:numberField(0,999,1),
  seenGreedy:booleanField,seed:numberField(0,65535,1),draws:numberField(0,maxDraws,1),
})
export const codec:UrlStateCodec<State>={
  encode:fields.encode,
  decode(params){
    const preset=SAMPLING_PRESETS.find(p=>p.id===params.get('preset'))??SAMPLING_PRESETS[0]
    const defaults=presetState(preset.id)
    const context=params.get('context')
    if(context && Object.hasOwn(SAMPLE_CONTEXTS,context)) defaults.customLogits=SAMPLE_CONTEXTS[context as SampleContextId].logits.join(',')
    return normalize(fields.decode(params,defaults))
  },
}
