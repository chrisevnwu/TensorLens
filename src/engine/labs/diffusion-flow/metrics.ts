import type {Point,TargetPoint} from './data'

/** Stable ties choose the first target in empirical dataset order. */
export function nearestTarget(p:Point,targets:readonly TargetPoint[]){
  if(!targets.length)throw new RangeError('Empirical target set cannot be empty')
  let index=0,best=Infinity
  for(let j=0;j<targets.length;j++){
    const target=targets[j]!,dx=p.x-target.x,dy=p.y-target.y,distance=dx*dx+dy*dy
    if(distance<best){best=distance;index=j}
  }
  return {distance:Math.sqrt(best),index,label:targets[index]!.label}
}

export function manifoldMetrics(particles:readonly Point[],targets:readonly TargetPoint[]){
  let distance=0,a=0,b=0
  for(const p of particles){
    const nearest=nearestTarget(p,targets)
    distance+=nearest.distance
    if(nearest.label===0)a++
    else b++
  }
  const n=particles.length||1
  return {meanDistance:distance/n,purityA:a/n,purityB:b/n}
}

export function trajectoryDistances(path: readonly Point[]) {
  const start = path[0], end = path.at(-1)
  if (!start || !end) return { pathLength: 0, displacement: 0 }
  let pathLength = 0
  for (let i = 1; i < path.length; i++) {
    const previous = path[i-1]!, current = path[i]!
    pathLength += Math.hypot(current.x - previous.x, current.y - previous.y)
  }
  return { pathLength, displacement: Math.hypot(end.x - start.x, end.y - start.y) }
}

/** Aggregate path length / aggregate displacement. A stationary ensemble has ratio one. */
export function pathStraightness(frames:readonly (readonly Point[])[]){
  const start=frames[0]
  if(!start||frames.length<2)return 1
  let length=0,displacement=0
  for(let i=1;i<frames.length;i++){
    const before=frames[i-1]!,after=frames[i]!
    if(after.length!==start.length)throw new RangeError('Trajectories must preserve particle correspondence')
    for(let j=0;j<after.length;j++){
      const p=after[j]!,q=before[j]!
      length+=Math.hypot(p.x-q.x,p.y-q.y)
      if(i===frames.length-1)displacement+=Math.hypot(p.x-start[j]!.x,p.y-start[j]!.y)
    }
  }
  // A moving ensemble that returns precisely to its starting point has
  // infinite path-to-displacement ratio, unlike a stationary ensemble.
  if(displacement===0)return length===0?1:Infinity
  return length/displacement
}
