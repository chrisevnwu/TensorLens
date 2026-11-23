import { describe, expect, it } from 'vitest'
import { createRng } from '../../../math/prng'
import { gaussianStart, makeDataset } from '../data'
import { simulateDiffusion, type DiffusionConfig, type SolverId } from '../engine'
import { DIFFUSION_PRESETS } from '../presets'
import { ddimStep, ddpmStep, flowStep, solvePath } from '../solvers'
import { alphaBar, denoise, flowVelocity } from '../fields'

const base:DiffusionConfig = {dataset:'moons',sampler:'compare',numSteps:20,schedule:'cosine',targetClass:'all',cfgScale:1.5}
const methods:SolverId[] = ['ddpm','ddim','flow']
const last = <T,>(values:T[]) => values[values.length-1]!

describe('single reverse transitions',()=>{
  const current={x:-.7,y:.8},x0={x:.4,y:-.2},alpha=.27,previous=.8
  const epsilon={x:(current.x-Math.sqrt(alpha)*x0.x)/Math.sqrt(1-alpha),y:(current.y-Math.sqrt(alpha)*x0.y)/Math.sqrt(1-alpha)}
  it('uses the exact Gaussian posterior mean and variance on a strided DDPM jump',()=>{
    const mean=(v:number,y:number)=>Math.sqrt(previous)*(1-alpha/previous)/(1-alpha)*y+
      Math.sqrt(alpha/previous)*(1-previous)/(1-alpha)*v
    const variance=(1-previous)*(1-alpha/previous)/(1-alpha)
    const noise={x:-1.75,y:.8}
    const next=ddpmStep(current,x0,alpha,previous,noise)
    expect(next.x).toBeCloseTo(mean(current.x,x0.x)+Math.sqrt(variance)*noise.x,13)
    expect(next.y).toBeCloseTo(mean(current.y,x0.y)+Math.sqrt(variance)*noise.y,13)
    expect(ddpmStep(current,x0,alpha,1,noise)).toEqual(x0)
  })
  it('transports a DDIM sample along its original fixed-noise coordinate',()=>{
    const next=ddimStep(x0,epsilon,previous)
    expect((next.x-Math.sqrt(previous)*x0.x)/Math.sqrt(1-previous)).toBeCloseTo(epsilon.x,13)
    expect((next.y-Math.sqrt(previous)*x0.y)/Math.sqrt(1-previous)).toBeCloseTo(epsilon.y,13)
    expect(ddimStep(x0,epsilon,1)).toEqual(x0)
  })
  it('evaluates the nonlinear rectified flow at the actual half-step state and time',()=>{
    const target=makeDataset('moons'),t=.2,h=.1,first=flowVelocity(current,target,t,'b',2)
    const midpoint={x:current.x+h/2*first.x,y:current.y+h/2*first.y}
    const midSlope=flowVelocity(midpoint,target,t+h/2,'b',2)
    const next=flowStep(current,target,t,h,'b',2)
    expect(next.x).toBeCloseTo(current.x+h*midSlope.x,13)
    expect(next.y).toBeCloseTo(current.y+h*midSlope.y,13)
  })
})

describe('empirical diffusion solver collection',()=>{
  it('starts 120 common Gaussian draws, computes only requested methods, and replays each trace',()=>{
    const coarse={...base,numSteps:5 as const}
    const together=simulateDiffusion(coarse,3), initial=gaussianStart(3)
    for(const sampler of methods){
      const solo=simulateDiffusion({...coarse,sampler},3)
      expect(Object.keys(solo.runs)).toEqual([sampler])
      expect(together.runs[sampler]).toEqual(solo.runs[sampler])
      const frames=solo.runs[sampler]!
      expect(frames).toHaveLength(6)
      expect(frames[0]!.particles).toEqual(initial)
      expect(frames.every(f=>f.particles.length===120)).toBe(true)
      expect(frames.map(f=>f.step)).toEqual([0,1,2,3,4,5])
      expect(frames[0]!.time).toBe(sampler==='flow'?0:1)
      expect(last(frames).time).toBe(sampler==='flow'?1:0)
    }
  })
  it('DDPM refreshes noise while DDIM and flow depend only on starting particles',()=>{
    const initial=[{x:.3,y:-.4},{x:.3,y:-.4}],target=makeDataset('rings')
    for(const sampler of methods){
      const a=solvePath(sampler,initial,target,base,createRng(1))
      const b=solvePath(sampler,initial,target,base,createRng(2))
      if(sampler==='ddpm'){
        expect(a[1]!.particles).not.toEqual(b[1]!.particles)
        expect(a[1]!.particles[0]).not.toEqual(a[1]!.particles[1])
      } else {
        expect(a).toEqual(b)
        expect(a[1]!.particles[0]).toEqual(a[1]!.particles[1])
      }
    }
  })
  it('consumes a fresh independent standard-normal pair at each nonterminal DDPM transition',()=>{
    const target=makeDataset('moons'), initial=gaussianStart(17,1), replay=createRng(9)
    const config={...base,numSteps:5 as const}
    const trace=solvePath('ddpm',initial,target,config,createRng(9))
    for(let step=0;step<4;step++){
      const current=trace[step]!.particles[0]!
      const alpha=alphaBar('cosine',1-step/5), previous=alphaBar('cosine',1-(step+1)/5)
      const {x0}=denoise(current,target,alpha,'all',1.5)
      const mean=ddpmStep(current,x0,alpha,previous,{x:0,y:0})
      const sigma=Math.sqrt((1-previous)*(1-alpha/previous)/(1-alpha))
      const next=trace[step+1]!.particles[0]!
      expect((next.x-mean.x)/sigma).toBeCloseTo(replay.nextGaussian(),11)
      expect((next.y-mean.y)/sigma).toBeCloseTo(replay.nextGaussian(),11)
    }
  })
  it('reduces mean manifold distance by >70% at 20 steps and measures straighter flow than DDPM',()=>{
    const {runs}=simulateDiffusion(base)
    for(const id of ['ddim','flow'] as const){
      const frames=runs[id]!
      expect(last(frames).meanDistance).toBeLessThan(.3*frames[0]!.meanDistance)
    }
    expect(last(runs.flow!).straightness).toBeLessThan(last(runs.ddpm!).straightness)
  })
  it('makes the few-step straightness mission measurable from matched trajectories',()=>{
    const {runs}=simulateDiffusion({...base,numSteps:10})
    expect(last(runs.flow!).straightness).toBeGreaterThanOrEqual(1)
    expect(last(runs.flow!).straightness).toBeLessThan(last(runs.ddpm!).straightness)
  })
  it('hits 90% Class A purity with CFG 2 on two moons and can steer to Class B',()=>{
    const cfg={...base,sampler:'ddim' as const}
    const purity=(targetClass:'all'|'a'|'b',cfgScale:number)=>last(simulateDiffusion({...cfg,targetClass,cfgScale}).runs.ddim!).purityA
    expect(purity('a',0)).toBe(purity('all',0))
    expect(purity('a',2)).toBeGreaterThanOrEqual(.90)
    expect(purity('b',2)).toBeLessThanOrEqual(.10)
  })
  it.each(['moons','swiss','rings','grid'] as const)('remains finite for %s across all step counts, schedules and guidance extremes',dataset=>{
    const target=makeDataset(dataset)
    const initial=[...gaussianStart(18,3),{x:4,y:-4}]
    for(const numSteps of [5,10,20,40] as const) for(const schedule of ['linear','cosine'] as const)
      for(const cfgScale of [0,1.5,5]) for(const targetClass of ['a','b'] as const) for(const id of methods){
        const frames=solvePath(id,initial,target,{...base,dataset,numSteps,schedule,cfgScale,targetClass},createRng(42))
        expect(frames.every(f=>Number.isFinite(f.straightness)&&Number.isFinite(f.meanDistance)&&f.particles.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)))).toBe(true)
      }
  })
  it('ships four distinct replayable experiment presets',()=>{
    expect(DIFFUSION_PRESETS.map(p=>p.id)).toEqual(['straight','compare','guidance','schedule'])
    expect(DIFFUSION_PRESETS.find(p=>p.id==='guidance')).toMatchObject({dataset:'moons',targetClass:'a',cfgScale:2})
    expect(DIFFUSION_PRESETS.find(p=>p.id==='straight')).toMatchObject({numSteps:10,sampler:'flow'})
  })
})
