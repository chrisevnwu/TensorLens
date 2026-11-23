import type { SeededRng } from '../../math/prng'
import type { Point, TargetPoint } from './data'
import type { DiffusionConfig, SolverFrame, SolverId } from './engine'
import { alphaBar, denoise, flowVelocity, type TargetClass } from './fields'
import { manifoldMetrics, pathStraightness } from './metrics'

export function ddimStep(x0:Point,epsilon:Point,previousAlpha:number):Point {
  const signal=Math.sqrt(previousAlpha), noise=Math.sqrt(1-previousAlpha)
  return {x:signal*x0.x+noise*epsilon.x,y:signal*x0.y+noise*epsilon.y}
}

/** q(x_s | x_t, x_0), for any earlier s, with the guided x_0 estimate. */
export function ddpmStep(current:Point,x0:Point,alpha:number,previousAlpha:number,z:Point):Point {
  if(previousAlpha===1) return {...x0}
  const transition=alpha/previousAlpha
  const x0Weight=Math.sqrt(previousAlpha)*(1-transition)/(1-alpha)
  const xtWeight=Math.sqrt(transition)*(1-previousAlpha)/(1-alpha)
  const sigma=Math.sqrt((1-previousAlpha)*(1-transition)/(1-alpha))
  return {
    x:x0Weight*x0.x+xtWeight*current.x+sigma*z.x,
    y:x0Weight*x0.y+xtWeight*current.y+sigma*z.y,
  }
}

/** Explicit midpoint integration for the conditional linear-interpolant velocity. */
export function flowStep(point:Point,target:readonly TargetPoint[],t:number,h:number,targetClass:TargetClass,cfgScale:number):Point {
  const slope=flowVelocity(point,target,t,targetClass,cfgScale)
  const midpoint={x:point.x+h/2*slope.x,y:point.y+h/2*slope.y}
  const midSlope=flowVelocity(midpoint,target,t+h/2,targetClass,cfgScale)
  return {x:point.x+h*midSlope.x,y:point.y+h*midSlope.y}
}

export function solvePath(method:SolverId,initial:Point[],target:TargetPoint[],config:DiffusionConfig,rng:SeededRng):SolverFrame[] {
  const {numSteps:n,schedule,targetClass,cfgScale}=config
  const frames:SolverFrame[]=[], history:Point[][]=[]
  let particles=initial
  for(let step=0;step<=n;step++){
    const progress=step/n
    const time=method==='flow'?progress:1-progress
    history.push(particles)
    const {meanDistance,purityA}=manifoldMetrics(particles,target)
    frames.push({step,time,progress,particles,meanDistance,purityA,straightness:pathStraightness(history)})
    if(step===n) break
    if(method==='flow'){
      particles=particles.map(point=>flowStep(point,target,progress,1/n,targetClass,cfgScale))
    } else {
      const alpha=alphaBar(schedule,time), previousAlpha=alphaBar(schedule,1-(step+1)/n)
      particles=particles.map(point=>{
        const {x0,epsilon}=denoise(point,target,alpha,targetClass,cfgScale)
        return method==='ddim'?ddimStep(x0,epsilon,previousAlpha):
          ddpmStep(point,x0,alpha,previousAlpha,{x:rng.nextGaussian(),y:rng.nextGaussian()})
      })
    }
  }
  return frames
}
