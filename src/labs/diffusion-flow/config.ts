import {booleanField,choiceField,makeUrlCodec,numberField,useLabUrlState,type UrlStateCodec} from '../../components/utils/useLabUrlState'
import {PARTICLE_COUNT} from '../../engine/labs/diffusion-flow/data'
import {SOLVERS,type DiffusionConfig} from '../../engine/labs/diffusion-flow/engine'
import {DIFFUSION_PRESETS,type DiffusionPresetId} from '../../engine/labs/diffusion-flow/presets'

export const DATASETS=['moons','swiss','rings','grid'] as const
export const SAMPLERS=[...SOLVERS,'compare'] as const
export const STEPS=[5,10,20,40] as const
export const CLASSES=['all','a','b'] as const
export const SCHEDULES=['cosine','linear'] as const
interface State extends DiffusionConfig {
  preset:DiffusionPresetId;step:number;particle:number;showVectorField:boolean;showTrails:boolean;fieldStart:boolean
}
export function presetState(id:DiffusionPresetId):State {
  const {id:preset,...config}=DIFFUSION_PRESETS.find(p=>p.id===id)??DIFFUSION_PRESETS[1]
  return {...config,preset,step:0,particle:0,showVectorField:true,showTrails:true,fieldStart:false}
}
const initial=presetState('compare')
const fields=makeUrlCodec<State>({
  preset:choiceField(DIFFUSION_PRESETS.map(p=>p.id)),dataset:choiceField(DATASETS),sampler:choiceField(SAMPLERS),
  numSteps:choiceField(STEPS),schedule:choiceField(SCHEDULES),targetClass:choiceField(CLASSES),cfgScale:numberField(0,5,.1),
  step:numberField(0,40,1),particle:numberField(0,PARTICLE_COUNT-1,1),showVectorField:booleanField,showTrails:booleanField,fieldStart:booleanField,
})
const codec:UrlStateCodec<State>={
  encode:fields.encode,
  decode(params){
    const id=DIFFUSION_PRESETS.find(p=>p.id===params.get('preset'))?.id??initial.preset
    const state=fields.decode(params,presetState(id))
    return {...state,step:Math.min(state.step,state.numSteps)}
  },
}
export function useDiffusionState(){return useLabUrlState(initial,codec)}
