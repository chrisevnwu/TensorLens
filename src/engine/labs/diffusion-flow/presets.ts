import type { DiffusionConfig } from './engine'
const base={dataset:'moons',sampler:'ddim',numSteps:20,schedule:'cosine',targetClass:'all',cfgScale:1.5} as const
export const DIFFUSION_PRESETS=[
  {...base,id:'straight',sampler:'flow',numSteps:10},
  {...base,id:'compare',sampler:'compare'},
  {...base,id:'guidance',targetClass:'a',cfgScale:2},
  {...base,id:'schedule',schedule:'linear',dataset:'rings'},
] as const satisfies readonly (DiffusionConfig & {id:string})[]
export type DiffusionPresetId=typeof DIFFUSION_PRESETS[number]['id']
