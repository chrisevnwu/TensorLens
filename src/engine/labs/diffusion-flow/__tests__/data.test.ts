import {describe,it,expect} from 'vitest'
import {makeDataset,gaussianStart,type DatasetId} from '../data'
const datasets:DatasetId[]=['moons','swiss','rings','grid']
describe('empirical 2D targets',()=>{
  it.each(datasets)('produces two balanced, reproducible %s classes',id=>{
    const points=makeDataset(id,42)
    expect(points).toHaveLength(120)
    expect(points.filter(p=>p.label===0)).toHaveLength(60)
    expect(points.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y))).toBe(true)
    expect(makeDataset(id,42)).toEqual(points)
    expect(makeDataset(id,43)).not.toEqual(points)
  })
  it('keeps moon orientation, ring labels and four grid modes identifiable',()=>{
    for(const p of makeDataset('moons'))expect(p.label===0?p.y:-p.y).toBeGreaterThan(0)
    for(const p of makeDataset('rings'))expect(Math.hypot(p.x,p.y)<1.2).toBe(p.label===0)
    const counts=Array<number>(4).fill(0)
    for(const p of makeDataset('grid')){const quadrant=Number(p.x>0)+2*Number(p.y>0);counts[quadrant]!++}
    expect(counts).toEqual([30,30,30,30])
  })
  it('replays identical unbiased Gaussian starts for each solver without aliasing arrays',()=>{
    const start=gaussianStart(9),match=gaussianStart(9)
    expect(start).toEqual(match);expect(start).toHaveLength(120)
    start[0]!.x+=1
    expect(start).not.toEqual(match)
    const larger=gaussianStart(9,20000)
    for(const axis of ['x','y'] as const){
      const mean=larger.reduce((s,p)=>s+p[axis],0)/larger.length
      const variance=larger.reduce((s,p)=>s+(p[axis]-mean)**2,0)/larger.length
      expect(Math.abs(mean)).toBeLessThan(.04);expect(Math.abs(variance-1)).toBeLessThan(.04)
    }
  })
})
