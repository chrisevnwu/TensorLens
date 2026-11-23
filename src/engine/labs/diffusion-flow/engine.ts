import { createRng } from '../../math/prng'
import { gaussianStart, makeDataset, type DatasetId, type Point, type TargetPoint } from './data'
import type { NoiseSchedule, TargetClass } from './fields'
import { solvePath } from './solvers'

export const SOLVERS=['ddpm','ddim','flow'] as const
export type SolverId=typeof SOLVERS[number]
export interface DiffusionConfig {
  dataset:DatasetId
  sampler:SolverId|'compare'
  numSteps:5|10|20|40
  schedule:NoiseSchedule
  targetClass:TargetClass
  cfgScale:number
}
export interface SolverFrame {
  step:number
  progress:number
  time:number
  particles:Point[]
  meanDistance:number
  straightness:number
  purityA:number
}
export interface DiffusionResult {
  target:TargetPoint[]
  runs:Partial<Record<SolverId,SolverFrame[]>>
}

export function simulateDiffusion(config:DiffusionConfig,seed=42):DiffusionResult {
  const target=makeDataset(config.dataset,seed),initial=gaussianStart(seed)
  const runs:DiffusionResult['runs']={}
  const methods=config.sampler==='compare'?SOLVERS:[config.sampler]
  for(const method of methods){
    // The reverse noise stream is independent from the Gaussian start, and
    // identical whether DDPM is run alone or alongside deterministic methods.
    runs[method]=solvePath(method,initial,target,config,createRng(seed^0x57d94ab))
  }
  return {target,runs}
}
