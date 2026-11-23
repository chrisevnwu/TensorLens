import { makeLoraTarget, rankApproximation, type TargetPreset } from './targets'
import { trainLora } from './training'

export interface LoraConfig {
  rank:number
  loraAlpha:number
  zeroInitB:boolean
  targetPreset:TargetPreset
}

/** All training frames share a frozen, deterministic target; model-memory estimates are independent. */
export function simulateLora(config:LoraConfig,seed=42,target=makeLoraTarget(config.targetPreset,seed)) {
  const {rank,loraAlpha,zeroInitB}=config
  const trainableParams=rank*(target.delta.rows+target.delta.cols)
  const baseParams=target.base.rows*target.base.cols
  const trainableFraction=trainableParams/(baseParams+trainableParams)
  return {
    target, approximation:rankApproximation(target,rank),
    frames:trainLora(target.delta,rank,loraAlpha,zeroInitB,100,seed),
    trainableParams,baseParams,trainableFraction,
  }
}

export type LoraResult=ReturnType<typeof simulateLora>
