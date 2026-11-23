import {createRng} from '../../math/prng'
export interface Point {x:number;y:number}
export interface TargetPoint extends Point {label:0|1}
export type DatasetId='moons'|'swiss'|'rings'|'grid'
const perClass=60
export const PARTICLE_COUNT=2*perClass
const tau=2*Math.PI

export function makeDataset(id:DatasetId,seed=42):TargetPoint[] {
  const rng=createRng(seed)
  return Array.from({length:PARTICLE_COUNT},(_,index)=>{
    const label=index<perClass?0:1
    const k=index%perClass
    // Stratified sampling gives both classes equal mass and retains a complete
    // curve at this small sample size. The local jitter is seeded.
    const u=(k+.5+.3*(rng.next()-.5))/perClass
    const angle=tau*u
    switch(id){
      case 'moons':{
        const theta=Math.PI*u
        const radius=1.14+rng.nextGaussian(0,.02)
        const x=radius*Math.cos(theta)-.45, y=.16+radius*Math.sin(theta)
        return {x:label===0?x:-x,y:label===0?y:-y,label}
      }
      case 'swiss':{
        const t=(label+u)/2
        const phi=Math.PI*(.45+4*t)
        const radius=.25+1.6*t+rng.nextGaussian(0,.014)
        return {x:radius*Math.cos(phi),y:radius*Math.sin(phi),label}
      }
      case 'rings':{
        const radius=(label===0?.73:1.72)+rng.nextGaussian(0,.018)
        return {x:radius*Math.cos(angle),y:radius*Math.sin(angle),label}
      }
      case 'grid':{
        const left=k<perClass/2
        const upper=left===(label===0)
        return {x:(left?-1.15:1.15)+rng.nextGaussian(0,.11),y:(upper?1.05:-1.05)+rng.nextGaussian(0,.11),label}
      }
    }
  })
}

/** A disjoint seed stream makes the initial prior independent of the chosen dataset. */
export function gaussianStart(seed=42,count=PARTICLE_COUNT):Point[] {
  if(!Number.isSafeInteger(count)||count<0)throw new RangeError('Expected a nonnegative particle count')
  const rng=createRng(seed^0x9e3779b9)
  return Array.from({length:count},()=>({x:rng.nextGaussian(),y:rng.nextGaussian()}))
}
