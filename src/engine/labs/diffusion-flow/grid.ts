import type { TargetPoint } from './data'
import { alphaBar,denoise,flowVelocity,type NoiseSchedule,type TargetClass } from './fields'

export interface FieldVector {x:number;y:number;dx:number;dy:number;magnitude:number}
export interface ScheduleSample {t:number;alphaBar:number;logSnr:number|null}

/** time follows the solver clock: diffusion runs 1→0, linear interpolation runs 0→1. */
export function fieldGrid(target:readonly TargetPoint[],solver:'ddpm'|'ddim'|'flow',time:number,
  schedule:NoiseSchedule,targetClass:TargetClass,cfgScale:number,extent=3,resolution=16):FieldVector[] {
  if(!(extent>0) || !Number.isFinite(extent) || !Number.isSafeInteger(resolution) || resolution<1 || resolution>128)
    throw new RangeError('Invalid vector field dimensions')
  const alpha=alphaBar(schedule,time)
  return Array.from({length:resolution**2},(_,i)=>{
    const x=(2*((i%resolution)+.5)/resolution-1)*extent
    const y=(2*(Math.floor(i/resolution)+.5)/resolution-1)*extent
    const vector=solver==='flow'?flowVelocity({x,y},target,time,targetClass,cfgScale):
      denoise({x,y},target,alpha,targetClass,cfgScale).score
    return {x,y,dx:vector.x,dy:vector.y,magnitude:Math.hypot(vector.x,vector.y)}
  })
}

export function scheduleSeries(schedule:NoiseSchedule):ScheduleSample[] {
  return Array.from({length:101},(_,t)=>{
    const a=alphaBar(schedule,t/100)
    return {t,alphaBar:a,logSnr:a===1?null:Math.log(a)-Math.log1p(-a)}
  })
}
