import { booleanField,choiceField,makeUrlCodec,numberField,useLabUrlState,type UrlStateCodec } from '../../components/utils/useLabUrlState'
import { type CircuitConfig,type CircuitType } from '../../engine/labs/backprop-optimizers/circuits'
import type {Landscape} from '../../engine/labs/backprop-optimizers/landscape'
import {OPTIMIZER_PRESETS,type OptimizerPresetId} from '../../engine/labs/backprop-optimizers/presets'
import {OPTIMIZERS,type RaceConfig} from '../../engine/labs/backprop-optimizers/race'
import type {LrSchedule} from '../../engine/labs/backprop-optimizers/schedule'

export interface State extends RaceConfig,CircuitConfig {
  preset:OptimizerPresetId;mode:'race'|'graph';raceStep:number;graphStep:number;node:string;visible:string;clicked:boolean;clipped:boolean
}
export const landscapes:Landscape[]=['ravine','rosenbrock','saddle','multimodal']
export const schedules:LrSchedule[]=['constant','cosine','warmup-cosine']
export const circuits:CircuitType[]=['neuron','attention','residual']
export function presetState(id:OptimizerPresetId):State {
  const {id:preset,...config}=OPTIMIZER_PRESETS.find(p=>p.id===id)??OPTIMIZER_PRESETS[0]
  return {...config,preset,raceStep:0,graphStep:0,node:'',visible:OPTIMIZERS.join(','),clicked:false,clipped:false}
}
const initial=presetState('ravine')
// Slider ticks are an editing affordance. SGD results and canvas coordinates must round-trip exactly.
const real=(min:number,max:number)=>(raw:string,fallback:number)=>{
  const v=Number(raw)
  return raw.trim() && Number.isFinite(v)?Math.max(min,Math.min(max,v)):fallback
}
const scalar=real(-32,32)
const fields=makeUrlCodec<State>({
  preset:choiceField(OPTIMIZER_PRESETS.map(p=>p.id)),mode:choiceField(['race','graph']),
  landscape:choiceField(landscapes),startX:real(-3,3),startY:real(-3,3),learningRate:numberField(.002,.3,.001),
  beta1:numberField(0,.99,.01),beta2:numberField(.5,.999,.001),weightDecay:numberField(0,.5,.01),lrSchedule:choiceField(schedules),
  circuit:choiceField(circuits),activation:choiceField(['relu','gelu']),skipConnection:booleanField,
  x1:scalar,x2:scalar,y:scalar,w1:scalar,w2:scalar,b:scalar,q1:scalar,q2:scalar,k1:scalar,k2:scalar,
  visible:(str)=>OPTIMIZERS.filter(id=>str.split(',').includes(id)).join(','),clicked:booleanField,clipped:booleanField,
  raceStep:numberField(0,100,1),graphStep:numberField(0,64,1),node:(str)=>/^n\d{1,3}$/.test(str)?str:'',
})
const codec:UrlStateCodec<State>={
  encode(s){return {...fields.encode(s),step:String(s.mode==='race'?s.raceStep:s.graphStep)}},
  decode(params){
    const preset=OPTIMIZER_PRESETS.find(p=>p.id===params.get('preset'))??OPTIMIZER_PRESETS[0]
    const s=fields.decode(params,presetState(preset.id))
    const step=params.get('step')
    if(step!==null){
      if(s.mode==='race') s.raceStep=numberField(0,100,1)(step,s.raceStep)
      else s.graphStep=numberField(0,64,1)(step,s.graphStep)
    }
    return s
  },
}
export function useArenaState(){return useLabUrlState(initial,codec)}
