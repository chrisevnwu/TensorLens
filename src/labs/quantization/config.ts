import { booleanField,choiceField,makeUrlCodec,numberField,type UrlStateCodec } from '../../components/utils/useLabUrlState'
import { FLOAT_FORMATS } from '../../engine/labs/quantization/bits'
import { type QuantConfig,type QuantMethod } from '../../engine/labs/quantization/engine'
import { QUANT_PRESETS,type QuantPresetId } from '../../engine/labs/quantization/presets'
import type { FloatFormat } from '../../engine/math/ieee754'

export const methods:QuantMethod[]=['fp16','bf16','fp8_e4m3','int8_sym','int8_asym','int4_sym','int4_asym','int4_group','nf4']
export const groups=[8,16,32,64]
export const modes=['tensor','bits'] as const
export const clearMasks={fp32:0,fp16:0,bf16:0,fp8_e4m3:0,fp8_e5m2:0}
export interface State extends QuantConfig,Record<FloatFormat,number> {
  preset:QuantPresetId; mode:typeof modes[number]; value:string; format:FloatFormat; row:number; col:number; exponentFlip:boolean
}
export function validNumber(text:string) {
  return /^(?:[+-]?(?:(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?|Infinity)|NaN)$/.test(text.trim()) && text.length<=64
}
export function presetState(id:QuantPresetId):State {
  const {id:preset,value,...config}=QUANT_PRESETS.find(p=>p.id===id)??QUANT_PRESETS[0]
  return {...config,preset,value:String(value),row:0,col:0,format:'bf16',exponentFlip:false,...clearMasks}
}
export const initial=presetState('clean')
const fields=makeUrlCodec<State>({
  preset:choiceField(QUANT_PRESETS.map(p=>p.id)),mode:choiceField(modes),method:choiceField(methods),
  groupSize:choiceField(groups),outlierMag:numberField(0,25,1),smoothAlpha:numberField(0,1,.05),
  value:(s,fallback)=>validNumber(s)?s.trim():fallback,format:choiceField(FLOAT_FORMATS),
  row:numberField(0,15,1),col:numberField(0,15,1),exponentFlip:booleanField,
  fp32:numberField(0,0xffffffff,1),fp16:numberField(0,0xffff,1),bf16:numberField(0,0xffff,1),
  fp8_e4m3:numberField(0,255,1),fp8_e5m2:numberField(0,255,1),
})
export const codec:UrlStateCodec<State>={
  encode:fields.encode,
  decode(params){
    const p=QUANT_PRESETS.find(p=>p.id===params.get('preset'))??QUANT_PRESETS[0]
    return fields.decode(params,presetState(p.id))
  },
}
