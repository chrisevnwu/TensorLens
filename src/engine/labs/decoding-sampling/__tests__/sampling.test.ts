import {expect,it} from 'vitest'
import {runSampling,type SamplingConfig} from '../engine'
import {SAMPLE_CONTEXTS,SAMPLING_PRESETS} from '../presets'

const baseline:SamplingConfig={
  logits:[Math.log(.4),Math.log(.3),Math.log(.2),Math.log(.1)],counts:[0,0,0,0],repetitionPenalty:1,
  frequencyPenalty:0,presencePenalty:0,temperature:1,topK:4,topP:1,minP:0,
}

it('applies sign-aware repetition and count-based frequency and presence penalties before temperature',()=>{
  const r=runSampling({...baseline,logits:[4,-2,0,3],counts:[2,1,2,0],repetitionPenalty:2,frequencyPenalty:.25,presencePenalty:.5,temperature:2})
  expect(r.adjustedLogits).toEqual([1,-4.75,-1,3])
  const exp=[1,-4.75,-1,3].map(z=>Math.exp(z/2)),total=exp.reduce((a,b)=>a+b,0)
  for(const [i,p] of r.baseProbs.entries()) expect(p).toBeCloseTo(exp[i]!/total,12)
})

it('uses the minimal original-mass nucleus prefix after Top-K, then the relative minimum threshold, and renormalizes only at the end',()=>{
  const r=runSampling({...baseline,topK:3,topP:.65,minP:.5})
  expect(r.stages).toHaveLength(6)
  expect(r.statuses).toEqual(['kept','kept','top-p','top-k'])
  expect(r.stages[2]!.reduce((a,b)=>a+b,0)).toBeCloseTo(.9,13)
  expect(r.stages[3]!.reduce((a,b)=>a+b,0)).toBeCloseTo(.7,13)
  expect(r.minThreshold).toBeCloseTo(.2,13)
  expect(r.probabilities[0]).toBeCloseTo(4/7,13)
  expect(r.probabilities[1]).toBeCloseTo(3/7,13)
  expect(r.probabilities.slice(2)).toEqual([0,0])
  const kMass=runSampling({...baseline,topK:2,topP:.55})
  expect(kMass.survivors).toBe(2)
  // .8 and .12 survive a .1-relative cutoff; .06 and .02 do not.
  const m=runSampling({...baseline,logits:[.8,.12,.06,.02].map(Math.log),minP:.1})
  expect(m.statuses).toEqual(['kept','kept','min-p','min-p'])
})

it('computes cumulative mass in descending score order and uses a deterministic index tie-break',()=>{
  const r=runSampling({...baseline,logits:[0,2,2,1]})
  expect(r.order).toEqual([1,2,3,0])
  let cumulative=0
  r.order.forEach((token,i)=>{cumulative+=r.baseProbs[token]!;expect(r.cumulative[i]).toBeCloseTo(cumulative,12)})
  expect(runSampling({...baseline,logits:[0,2,2,1],greedy:true}).probabilities).toEqual([0,1,0,0])
  expect(runSampling({...baseline,logits:[0,2,2,1],temperature:0}).probabilities).toEqual([0,1,0,0])
})

it('always retains at least one token, obeys Top-K, and returns finite unit mass under extreme combined filters',()=>{
  for(const logit of [0,10000,-10000]) for(const k of [1,2,4]) for(const t of [.05,.8,2.5]) {
    const r=runSampling({...baseline,logits:[logit,logit,logit+1,logit-1],topK:k,temperature:t,topP:.1,minP:.5})
    expect(r.survivors).toBeGreaterThanOrEqual(1)
    expect(r.survivors).toBeLessThanOrEqual(k)
    expect(r.probabilities.every(p=>Number.isFinite(p)&&p>=0)).toBe(true)
    expect(Math.abs(r.probabilities.reduce((a,b)=>a+b,0)-1)).toBeLessThan(1e-10)
    const h=r.probabilities.reduce((sum,p)=>sum-(p?p*Math.log2(p):0),0)
    expect(r.entropyBits).toBeCloseTo(h,12)
    expect(r.perplexity).toBeCloseTo(2**h,12)
    expect(r.top1).toBe(Math.max(...r.probabilities))
  }
  expect(runSampling({...baseline,logits:[3],counts:[4]}).probabilities).toEqual([1])
})

it('increases entropy with temperature and preserves uniform entropy',()=>{
  const entropy=(temperature:number,logits:number[])=>runSampling({...baseline,logits,temperature}).entropyBits
  for(const [low,high] of [[.2,.7],[.7,1],[1,2.5]] as const) {
    expect(entropy(high,[3,2,1,0])).toBeGreaterThan(entropy(low,[3,2,1,0]))
    expect(entropy(high,[2,2,2,2])).toBe(entropy(low,[2,2,2,2]))
  }
})

it('uses distinct 16-word contexts with prior counts matching the displayed prompt',()=>{
  for(const c of Object.values(SAMPLE_CONTEXTS)) {
    expect(new Set(c.words).size).toBe(16)
    expect(c.logits.length).toBe(16)
    const prior=c.prompt.match(/[\p{L}\p{N}_]+|[^\s]/gu)??[]
    expect(c.counts).toEqual(c.words.map(word=>prior.filter(x=>x===word).length))
  }
})

it('reaches the high-temperature factual challenge and prunes creative tail tokens while retaining runners-up',()=>{
  const config={...SAMPLING_PRESETS[0],...SAMPLE_CONTEXTS.factual}
  const cold=runSampling(config)
  const hot=runSampling({...config,temperature:1.8})
  expect(hot.perplexity).toBeGreaterThanOrEqual(4)
  expect(hot.perplexity/cold.perplexity).toBeGreaterThanOrEqual(3)
  const min=runSampling({...SAMPLING_PRESETS[1],...SAMPLE_CONTEXTS.story,topP:1,minP:.1})
  expect(min.survivors).toBeLessThan(16)
  expect(min.survivors).toBeGreaterThanOrEqual(2)
  expect(min.statuses[min.order[1]!]).toBe('kept')
  expect(min.statuses).toContain('min-p')
})
