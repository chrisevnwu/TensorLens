import { describe, expect, it } from 'vitest'
import { alphaBar, denoise, flowVelocity, forwardSample } from '../fields'
import type { Point, TargetPoint } from '../data'

const targets: TargetPoint[] = [
  { x: -1.2, y: 0.8, label: 0 },
  { x: 0.2, y: -0.4, label: 1 },
  { x: 1.7, y: 0.6, label: 1 },
]
const q = { x: 0.35, y: -0.65 }
function near(actual: Point, expected: Point, digits = 10) {
  expect(actual.x).toBeCloseTo(expected.x, digits)
  expect(actual.y).toBeCloseTo(expected.y, digits)
}
function independentMeans(samples: TargetPoint[], x: Point, gain: number, variance: number) {
  const weights = samples.map(y => Math.exp(-((x.x-gain*y.x)**2+(x.y-gain*y.y)**2)/(2*variance)))
  const sum = weights.reduce((s,w)=>s+w,0)
  return { x: weights.reduce((s,w,i)=>s+w*samples[i]!.x,0)/sum,
    y: weights.reduce((s,w,i)=>s+w*samples[i]!.y,0)/sum }
}

describe('diffusion schedules and forward identity', () => {
  it.each(['cosine','linear'] as const)('builds all 100 strictly decreasing positive cumulative %s steps', schedule=>{
    const samples = Array.from({length:101},(_,i)=>alphaBar(schedule,i/100))
    expect(samples[0]).toBe(1)
    samples.slice(1).forEach((a,i)=>{ expect(a).toBeGreaterThan(0); expect(a).toBeLessThan(samples[i]!) })
    const cosine = (t:number)=>Math.cos((t+0.008)/1.008*Math.PI/2)**2
    let prior=1
    for(let i=1;i<=100;i++) {
      const beta = schedule==='linear'? 0.001+(i-1)*0.199/99 :
        Math.min(0.999,1-cosine(i/100)/cosine((i-1)/100))
      prior*=1-beta
      expect(samples[i]).toBeCloseTo(prior,14)
    }
    expect(alphaBar(schedule,.405)).toBeCloseTo(Math.sqrt(samples[40]!*samples[41]!),14)
  })
  it('mixes the supplied clean point and noise, including endpoints',()=>{
    const noise={x:-.8,y:.4}
    near(forwardSample(q,noise,1),q)
    near(forwardSample(q,noise,0),noise)
    near(forwardSample(q,noise,.36),{x:.6*q.x+.8*noise.x,y:.6*q.y+.8*noise.y})
  })
})

describe('closed-form empirical diffusion field',()=>{
  it('returns normalized mixture means, independent restricted-class means and guided epsilon',()=>{
    const a=.61, gain=Math.sqrt(a),v=1-a+a*.06**2
    const uncond=independentMeans(targets,q,gain,v)
    const cond=independentMeans(targets.filter(p=>p.label===1),q,gain,v)
    for(const w of [0,1,2.5]) {
      const out=denoise(q,targets,a,'b',w)
      const guided={x:uncond.x+w*(cond.x-uncond.x),y:uncond.y+w*(cond.y-uncond.y)}
      near(out.x0,guided); near(out.unconditionalX0,uncond); near(out.conditionalX0,cond)
      near(out.epsilon,{x:(q.x-gain*guided.x)/Math.sqrt(1-a),y:(q.y-gain*guided.y)/Math.sqrt(1-a)})
      near(forwardSample(out.x0,out.epsilon,a),q)
    }
  })
  it('agrees with central differences of the smoothed mixture log density, including clean time',()=>{
    for (const a of [.17,.87,1]) {
      const gain=Math.sqrt(a),v=1-a+a*.06**2
      const logDensity=(x:number,y:number)=>Math.log(targets.reduce((s,p)=>
        s+Math.exp(-((x-gain*p.x)**2+(y-gain*p.y)**2)/(2*v)),0))
      const h=1e-5
      near(denoise(q,targets,a).score,{x:(logDensity(q.x+h,q.y)-logDensity(q.x-h,q.y))/(2*h),
        y:(logDensity(q.x,q.y+h)-logDensity(q.x,q.y-h))/(2*h)},7)
    }
  })
  it('keeps extremely unlikely class conditionals defined after global exponential underflow',()=>{
    const distant={x:1e150,y:-1e150}
    const out=denoise(distant,targets,1,'a',1)
    near(out.conditionalX0,targets[0]!)
    near(out.unconditionalX0,targets[2]!)
    for(const vector of [out.x0,out.epsilon,out.score]) {
      expect(Number.isFinite(vector.x)&&Number.isFinite(vector.y)).toBe(true)
    }
    near(denoise(q,targets,0).score,{x:-q.x,y:-q.y})
  })
})

describe('linear interpolation marginal velocity',()=>{
  it('conditions on the exact linear Gaussian likelihood and applies class guidance to velocity',()=>{
    const t=.45,uncond=independentMeans(targets,q,t,(1-t)**2)
    const cond=independentMeans(targets.filter(p=>p.label===1),q,t,(1-t)**2)
    for(const w of [0,1,3]) {
      near(flowVelocity(q,targets,t,'b',w),{
        x:(uncond.x+w*(cond.x-uncond.x)-q.x)/(1-t),
        y:(uncond.y+w*(cond.y-uncond.y)-q.y)/(1-t),
      })
    }
  })
  it('uses a uniform prior at noise time and the nearest clean component at the limiting endpoint',()=>{
    near(flowVelocity(q,targets,0),{x:(-1.2+.2+1.7)/3-q.x,y:(.8-.4+.6)/3-q.y})
    near(flowVelocity(q,targets,1),{x:(.2-q.x)/.02,y:(-.4-q.y)/.02})
    near(flowVelocity(q,targets,1,'a',1),{x:(-1.2-q.x)/.02,y:(.8-q.y)/.02})
  })
})
