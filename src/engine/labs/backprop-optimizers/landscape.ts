export type Landscape = 'ravine' | 'rosenbrock' | 'saddle' | 'multimodal'
export interface LandscapeValue { loss:number; dx:number; dy:number }

export function evaluateLandscape(id:Landscape,x:number,y:number):LandscapeValue {
  switch (id) {
    case 'ravine': return {loss:.5*x*x+12*y*y,dx:x,dy:24*y}
    case 'rosenbrock': {
      const residual=y-x*x
      return {loss:(1-x)**2+10*residual**2,dx:2*(x-1)-40*x*residual,dy:20*residual}
    }
    case 'saddle': return {loss:x*x-y*y+.1*(x**4+y**4),dx:2*x+.4*x**3,dy:-2*y+.4*y**3}
    case 'multimodal': {
      const sx=Math.sin(2*x),cx=Math.cos(2*x),sy=Math.sin(2*y),cy=Math.cos(2*y)
      return {loss:sx*cy+.15*(x*x+y*y),dx:2*cx*cy+.3*x,dy:-2*sx*sy+.3*y}
    }
  }
}

export const plotMin=-3, plotMax=3
export function pointFromPlot(u:number,v:number) {
  return {x:plotMin+(plotMax-plotMin)*u,y:plotMax-(plotMax-plotMin)*v}
}
export type Segment=[u1:number,v1:number,u2:number,v2:number]
export interface Contour { level:number; segments:Segment[] }
export interface LandscapeGrid {
  size:number; min:number; max:number; losses:Float64Array; intensities:Float32Array; contours:Contour[]
}

function contour(losses:Float64Array,size:number,level:number):Contour {
  const segments:Segment[]=[],last=size-1
  for(let r=0;r<last;r++) for(let c=0;c<last;c++){
    const at=r*size+c
    const a=losses[at]!,b=losses[at+1]!,d=losses[at+size]!,e=losses[at+size+1]!
    if(Math.min(a,b,d,e)>=level || Math.max(a,b,d,e)<level) continue
    const points:[number,number][]=[]
    if((a>=level)!==(b>=level)) points.push([(c+(level-a)/(b-a))/last,r/last])
    if((b>=level)!==(e>=level)) points.push([(c+1)/last,(r+(level-b)/(e-b))/last])
    if((e>=level)!==(d>=level)) points.push([(c+(level-d)/(e-d))/last,(r+1)/last])
    if((d>=level)!==(a>=level)) points.push([c/last,(r+(level-a)/(d-a))/last])
    const join=(i:number,j:number)=>segments.push([...points[i]!,...points[j]!])
    if(points.length===2) join(0,1)
    else if(points.length===4){
      // On an ambiguous saddle cell, use its bilinear center to decide which
      // sign is connected. This preserves two distinct contours through the cell.
      if(((a+b+d+e)/4>=level)===(a>=level)){join(0,1);join(2,3)}
      else {join(0,3);join(1,2)}
    }
  }
  return {level,segments}
}

/** Intensities use log1p of loss above the sampled minimum, including negative landscapes. */
export function sampleLandscape(id:Landscape,size=97):LandscapeGrid {
  if(!Number.isInteger(size)||size<2||size>512) throw new RangeError('Landscape grid resolution must be 2..512')
  const losses=new Float64Array(size*size)
  let min=Infinity,max=-Infinity
  for(let r=0;r<size;r++) for(let c=0;c<size;c++){
    const {x,y}=pointFromPlot(c/(size-1),r/(size-1))
    const {loss}=evaluateLandscape(id,x,y)
    losses[r*size+c]=loss;min=Math.min(min,loss);max=Math.max(max,loss)
  }
  const span=max-min||1, contrast=63,denominator=Math.log1p(contrast)
  const intensities=Float32Array.from(losses,v=>Math.log1p((v-min)*contrast/span)/denominator)
  const contours=Array.from({length:9},(_,i)=>{
    const level=min+span*Math.expm1(denominator*(i+1)/10)/contrast
    return contour(losses,size,level)
  })
  return {size,min,max,losses,intensities,contours}
}
