import { describe,expect,it } from 'vitest'
import { evaluateLandscape,sampleLandscape,pointFromPlot,type Landscape } from '../landscape'
const fields:Landscape[]=['ravine','rosenbrock','saddle','multimodal']
describe('analytical two-dimensional objectives',()=>{
  it.each(fields)('matches central derivatives throughout %s',field=>{
    const h=1e-5
    for(const u of [.03,.25,.5,.71,.93])for(const v of [.09,.33,.52,.82]){
      const {x,y}=pointFromPlot(u,v)
      const {dx,dy}=evaluateLandscape(field,x,y)
      const nx=(evaluateLandscape(field,x+h,y).loss-evaluateLandscape(field,x-h,y).loss)/(2*h)
      const ny=(evaluateLandscape(field,x,y+h).loss-evaluateLandscape(field,x,y-h).loss)/(2*h)
      expect(Math.abs(dx-nx)).toBeLessThan(1e-5);expect(Math.abs(dy-ny)).toBeLessThan(1e-5)
    }
  })
  it('samples top-left and bottom-right in mathematical coordinates and preserves negative saddle losses',()=>{
    expect(pointFromPlot(0,0)).toEqual({x:-3,y:3});expect(pointFromPlot(1,1)).toEqual({x:3,y:-3})
    const g=sampleLandscape('saddle',23)
    expect(g.min).toBeLessThan(0);expect(g.max).toBeGreaterThan(0)
    for(const [col,row] of [[0,0],[22,22],[9,15]] as const){
      const {x,y}=pointFromPlot(col/22,row/22)
      expect(g.losses[row*23+col]).toBeCloseTo(evaluateLandscape('saddle',x,y).loss,12)
    }
    expect(Math.min(...g.intensities)).toBe(0);expect(Math.max(...g.intensities)).toBe(1)
  })
  it('interpolates contour vertices within the unit plot on the specified isolevel',()=>{
    const g=sampleLandscape('ravine',65)
    expect(g.contours.length).toBeGreaterThan(4)
    for(const line of g.contours){
      expect(line.segments.length).toBeGreaterThan(0)
      for(const [u,v] of line.segments.slice(0,15)){
        expect(u).toBeGreaterThanOrEqual(0);expect(v).toBeLessThanOrEqual(1)
        const {x,y}=pointFromPlot(u,v)
        // Linear interpolation along an edge of a convex quadratic lies above
        // the true curve by at most max curvature * gridSpacing² / 8.
        expect(Math.abs(evaluateLandscape('ravine',x,y).loss-line.level)).toBeLessThan(.027)
      }
    }
    expect(sampleLandscape('ravine',9)).toEqual(sampleLandscape('ravine',9))
  })
})
