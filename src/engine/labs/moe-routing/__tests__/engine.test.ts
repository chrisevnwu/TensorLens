import { expect, it } from 'vitest'
import { auxGradient, auxiliaryLoss, simulateMoe } from '../engine'
import { MOE_PRESETS } from '../presets'

const base=MOE_PRESETS[0]

it('returns exact uniform and collapsed auxiliary-loss limits, including zero alpha',()=>{
  for(const E of [4,6,8]) {
    const probs=Array.from({length:E},()=>Array<number>(E).fill(1/E))
    const assignments=Array<number>(E).fill(2)
    expect(auxiliaryLoss(probs,assignments,.05)/.05).toBeCloseTo(1,12)
    const oneHot=Array.from({length:E},()=>Array.from({length:E},(_,i)=>Number(i===0)))
    const collapsed=Array.from({length:E},(_,i)=> i===0 ? 2*E : 0)
    expect(auxiliaryLoss(oneHot,collapsed,.05)/.05).toBeCloseTo(E,12)
    expect(auxiliaryLoss(oneHot,collapsed,0)).toBe(0)
  }
})

it('differentiates the Switch objective with detached assignments, matching every central difference',()=>{
  const z=[[.4,-.5,1.25],[-.2,.8,1.1],[1.8,1.2,-.6]]
  const assigned=[3,1,2],alpha=.08
  function probs(input:number[][]) {
    return input.map(row=>{const ex=row.map(x=>Math.exp(x)); const mass=ex.reduce((a,b)=>a+b,0); return ex.map(x=>x/mass)})
  }
  const gradients=auxGradient(probs(z),assigned,alpha)
  const h=1e-5
  for(let i=0;i<z.length;i++) for(let j=0;j<z[i]!.length;j++) {
    const hi=z.map(row=>[...row]), lo=z.map(row=>[...row])
    hi[i]![j]=hi[i]![j]!+h; lo[i]![j]=lo[i]![j]!-h
    const diff=(auxiliaryLoss(probs(hi),assigned,alpha)-auxiliaryLoss(probs(lo),assigned,alpha))/(2*h)
    expect(Math.abs(gradients[i]![j]!-diff)).toBeLessThan(1e-7)
  }
})

it.each(MOE_PRESETS)('keeps normalized probabilities and conserved routing loads in all 31 frames of $id',preset=>{
  const run=simulateMoe(preset)
  const {numTokens:T,numExperts:E,topK:K}=preset
  expect(run.tokens).toHaveLength(T)
  expect(run.tokens.every(t=>t.features.length===8)).toBe(true)
  expect(run.frames).toHaveLength(31)
  for(const [step,f] of run.frames.entries()) {
    expect(f.step).toBe(step)
    expect(f.probs).toHaveLength(T)
    for(const row of f.probs) {
      expect(row).toHaveLength(E)
      expect(row.every(p=>Number.isFinite(p)&&p>=0&&p<=1)).toBe(true)
      expect(row.reduce((a,b)=>a+b,0)).toBeCloseTo(1,12)
    }
    for (let token=0;token<T;token++) {
      const routes=f.routes.filter(route=>route.token===token)
      const mass=routes.reduce((sum,route)=>sum+f.probs[token]![route.expert]!,0)
      expect(new Set(routes.map(route=>route.expert)).size).toBe(K)
      expect(routes.reduce((sum,r)=>sum+r.weight,0)).toBeCloseTo(1,12)
      for (const route of routes) expect(route.weight).toBeCloseTo(f.probs[token]![route.expert]!/mass,12)
    }
    const fullyDropped=run.tokens.filter(token=>f.routes.filter(r=>r.token===token.id).every(r=>r.dropped)).length
    expect(f.fullyDroppedTokens).toBe(fullyDropped)
    expect(f.fullyDroppedRate).toBeCloseTo(fullyDropped/T,12)
    const total=f.assigned.reduce((a,b)=>a+b,0)
    expect(total).toBe(T*K)
    expect(f.capacity).toBe(Math.max(1,Math.ceil(preset.capacityFactor*T*K/E)))
    const accepted=f.accepted.reduce((a,b)=>a+b,0)
    expect(f.accepted.every((n,e)=>n<=f.capacity && n<=f.assigned[e]!)).toBe(true)
    expect(f.droppedRate).toBeCloseTo((total-accepted)/total,12)
    const mean=total/E
    const variance=f.assigned.reduce((sum,count)=>sum+(count-mean)**2,0)/E
    expect(f.loadVariance).toBeCloseTo(variance,12)
    expect(f.loadCV).toBeCloseTo(Math.sqrt(variance)/mean,12)
    expect(f.maxExpertShare).toBeCloseTo(Math.max(...f.assigned)/total,12)
    expect(f.activeRatio).toBe(K/E)
    expect(f.auxLoss).toBeCloseTo(auxiliaryLoss(f.probs,f.assigned,preset.auxAlpha),12)
  }
})

it('lowers assignment-load variance under both balancing strategies at training step 25',()=>{
  const run=(balancingMode:'none'|'aux-loss'|'loss-free-bias')=>simulateMoe({...base,balancingMode}).frames
  const none=run('none'), aux=run('aux-loss'), bias=run('loss-free-bias')
  expect(aux[25]!.loadVariance).toBeLessThan(none[25]!.loadVariance)
  expect(bias[25]!.loadVariance).toBeLessThan(none[25]!.loadVariance)
  expect(bias.at(-1)!.selectionBias).not.toEqual(bias[0]!.selectionBias)
  expect(bias.at(-1)!.routerWeights.to2D()).toEqual(bias[0]!.routerWeights.to2D())
  expect(bias.at(-1)!.probs).toEqual(bias[0]!.probs)
  expect(aux.at(-1)!.routerWeights.to2D()).not.toEqual(aux[0]!.routerWeights.to2D())
})

it('reaches each guided challenge by simulating an allowed configuration',()=>{
  expect(simulateMoe(MOE_PRESETS[1]).frames.some(f=>f.step>=15 && f.maxExpertShare>=.45)).toBe(true)
  expect([MOE_PRESETS[0],MOE_PRESETS[3]].some(p=>simulateMoe(p).frames.some(f=>f.step>=10 && f.droppedRate===0))).toBe(true)
  expect(simulateMoe({...base,numExperts:8,topK:2}).frames[0]!.activeRatio).toBe(.25)
})

it('remains deterministic across extreme supported batch, capacity, jitter and Top-K settings',()=>{
  const config={...base,numTokens:24,numExperts:8,topK:3,capacityFactor:.75,routerNoise:.5}
  const a=simulateMoe(config)
  expect(a).toEqual(simulateMoe(config))
  expect(a.frames.every(f=>[f.droppedRate,f.auxLoss,f.loadCV,f.maxExpertShare].every(Number.isFinite))).toBe(true)
  expect(simulateMoe({...base,numTokens:8,topK:1,capacityFactor:2,routerNoise:0}).frames).toHaveLength(31)
})
