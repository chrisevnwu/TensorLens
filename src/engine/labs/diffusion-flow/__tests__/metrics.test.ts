import {describe,it,expect} from 'vitest'
import {manifoldMetrics,nearestTarget,trajectoryDistances,pathStraightness} from '../metrics'
const targets=[{x:0,y:0,label:0},{x:4,y:0,label:1}] as const
describe('empirical manifold and trajectory geometry',()=>{
  it('uses Euclidean nearest distance and nearest target label, including deterministic ties',()=>{
    expect(nearestTarget({x:4,y:3},targets)).toEqual({index:1,distance:3,label:1})
    expect(nearestTarget({x:2,y:0},targets).index).toBe(0)
    expect(manifoldMetrics([{x:0,y:0},{x:1,y:0},{x:4,y:3}],targets)).toEqual({meanDistance:4/3,purityA:2/3,purityB:1/3})
  })
  it('distinguishes the distance traveled from the displacement of one inspected particle',()=>{
    const origin={x:0,y:0}, turn={x:3,y:0}, end={x:3,y:4}
    expect(trajectoryDistances([])).toEqual({pathLength:0,displacement:0})
    expect(trajectoryDistances([origin])).toEqual({pathLength:0,displacement:0})
    expect(trajectoryDistances([origin,turn,end])).toEqual({pathLength:7,displacement:5})
    expect(trajectoryDistances([origin,turn,end,origin])).toEqual({pathLength:12,displacement:0})
  })
  it('divides actual summed path lengths by endpoint displacements over matched particle indices',()=>{
    const start=[{x:0,y:0},{x:2,y:1}],mid=[{x:1,y:0},{x:3,y:1}],end=[{x:1,y:1},{x:4,y:1}]
    expect(pathStraightness([start,mid,end])).toBeCloseTo(4/(Math.SQRT2+2),13)
    expect(pathStraightness([start,end])).toBe(1)
    expect(pathStraightness([start,start])).toBe(1)
    expect(pathStraightness([start])).toBe(1)
    expect(()=>pathStraightness([start,[end[0]!]])).toThrow()
  })
})
