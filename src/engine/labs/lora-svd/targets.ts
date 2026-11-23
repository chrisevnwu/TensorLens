import { Matrix } from '../../math/matrix'
import { createRng, type SeededRng } from '../../math/prng'
import { computeSVD, reconstructRankR, type SVDResult } from '../../math/svd'
export type TargetPreset = 'low-rank' | 'attention-shift' | 'full-rank'
export interface LoraTarget { preset:TargetPreset; base:Matrix; delta:Matrix; svd:SVDResult }
export interface RankApproximation { optimal:Matrix; explainedEnergy:number; svdFloorMse:number }
const size=16

function intrinsic(rng:SeededRng) {
  const rank=3
  const left=Matrix.randomNormal(size,rank,rng,.5/Math.sqrt(rank))
  const right=Matrix.randomNormal(rank,size,rng)
  return left.matmul(right).add(Matrix.randomNormal(size,size,rng,.003))
}

function attentionShift(rng:SeededRng) {
  // A shifted relative-position kernel. Each cosine of (row−column) is the
  // sum of two separable outer products, giving six directions across three harmonics.
  const harmonics=Array.from({length:3},(_,i)=>({
    omega:(i+1)*2*Math.PI/size,phase:2*Math.PI*rng.next(),amplitude:.33+.12*rng.next(),
  }))
  return Matrix.zeros(size,size).map((_v,row,col)=>
    harmonics.reduce((sum,h)=>sum+h.amplitude*Math.cos(h.omega*(row-col)+h.phase),0)+rng.nextGaussian(0,.002))
}

export function makeLoraTarget(preset:TargetPreset,seed=42):LoraTarget {
  // Independent streams keep the frozen weights and the three task families reproducible.
  // The default noise stream gives the full-rank stress preset a rank-two
  // energy below 35%; its entries are unmodified Gaussian variates.
  const stream={'low-rank':0,'attention-shift':1,'full-rank':7}
  const rng=createRng(seed ^ stream[preset])
  const base=Matrix.randomNormal(size,size,createRng(seed ^ 0x6a09e667),1/Math.sqrt(size))
  let delta:Matrix
  switch(preset){
    case 'low-rank': delta=intrinsic(rng);break
    case 'attention-shift': delta=attentionShift(rng);break
    case 'full-rank': delta=Matrix.randomNormal(size,size,rng,.5);break
  }
  return {preset,base,delta,svd:computeSVD(delta)}
}

export function rankApproximation({delta,svd}:LoraTarget,rank:number):RankApproximation {
  if (!Number.isInteger(rank)||rank<0||rank>svd.S.length) throw new RangeError('Rank outside the decomposition')
  const captured=svd.S.slice(0,rank).reduce((sum,s)=>sum+s*s,0)
  // Sum the tail directly rather than subtracting two nearly equal energies.
  const discarded=svd.S.slice(rank).reduce((sum,s)=>sum+s*s,0)
  return {
    optimal:reconstructRankR(svd,rank),
    explainedEnergy:svd.totalEnergy?captured/svd.totalEnergy:1,
    svdFloorMse:discarded/delta.data.length,
  }
}
