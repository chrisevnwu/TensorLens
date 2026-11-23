import {useMemo} from 'react'
import {HiDPICanvas} from '../../components/viz/HiDPICanvas'
import {sequentialColor} from '../../engine/math/colormaps'
import {sampleLandscape,pointFromPlot,plotMin,plotMax,type Landscape,type LandscapeGrid} from '../../engine/labs/backprop-optimizers/landscape'
import type {RaceFrame,OptimizerId,RacePoint} from '../../engine/labs/backprop-optimizers/race'
import {useAppStore,type ThemeMode} from '../../store/useAppStore'
import {useI18n} from '../../i18n'
import {raceVisuals} from '../../i18n/labs/race-visuals'
export const tones={sgd:'primary',momentum:'secondary',rmsprop:'good',adam:'warn',adamw:'danger'} as const
export const outside=(p:RacePoint)=>p.x<plotMin||p.x>plotMax||p.y<plotMin||p.y>plotMax
const clamp=(n:number)=>Math.max(plotMin,Math.min(plotMax,n))
const margin={left:31,right:9,top:9,bottom:23}
const span=plotMax-plotMin

function raster(grid:LandscapeGrid,theme:ThemeMode){
  if(typeof ResizeObserver==='undefined')return null
  const canvas=document.createElement('canvas')
  canvas.width=grid.size;canvas.height=grid.size
  const context=canvas.getContext('2d')
  if(!context)return null
  const image=context.createImageData(grid.size,grid.size)
  const colors=Array.from({length:256},(_,i)=>parseInt(sequentialColor(.08+.52*i/255,theme).slice(1),16))
  grid.intensities.forEach((v,i)=>{
    const color=colors[Math.round(255*v)]!
    image.data[4*i]=(color>>>16)&255;image.data[4*i+1]=(color>>>8)&255;image.data[4*i+2]=color&255;image.data[4*i+3]=255
  })
  context.putImageData(image,0,0)
  return canvas
}

interface Props {frames:RaceFrame[];step:number;visible:readonly OptimizerId[];landscape:Landscape;onStartChange:(x:number,y:number)=>void}
export function RaceCanvas({frames,step,visible,landscape,onStartChange}:Props){
  const {locale}=useI18n(),t=raceVisuals[locale]
  const theme=useAppStore(s=>s.theme)
  const grid=useMemo(()=>sampleLandscape(landscape),[landscape])
  const texture=useMemo(()=>raster(grid,theme),[grid,theme])
  const start=frames[0]!.points.sgd
  return <section className="race-plane"><h2>{t.arena}</h2>
    <HiDPICanvas label={t.arena} data-race-canvas="" tabIndex={0}
      onClick={e=>{
        const box=e.currentTarget.getBoundingClientRect()
        const u=(e.clientX-box.left-margin.left)/(box.width-margin.left-margin.right)
        const v=(e.clientY-box.top-margin.top)/(box.height-margin.top-margin.bottom)
        const p=pointFromPlot(Math.max(0,Math.min(1,u)),Math.max(0,Math.min(1,v)))
        onStartChange(p.x,p.y)
      }} onKeyDown={e=>{
        const changes:Record<string,[number,number]>={ArrowLeft:[-.05,0],ArrowRight:[.05,0],ArrowUp:[0,.05],ArrowDown:[0,-.05]}
        const d=changes[e.key]
        if(d){e.preventDefault();e.stopPropagation();onStartChange(clamp(start.x+d[0]),clamp(start.y+d[1]))}
      }} onRender={(ctx,{width,height,palette})=>{
        const w=width-margin.left-margin.right,h=height-margin.top-margin.bottom
        if(w<=0||h<=0)return
        const sx=(x:number)=>margin.left+(x-plotMin)*w/span,sy=(y:number)=>margin.top+(plotMax-y)*h/span
        ctx.fillStyle=palette.canvas;ctx.fillRect(0,0,width,height)
        if(texture){ctx.imageSmoothingEnabled=true;ctx.drawImage(texture,margin.left,margin.top,w,h)}
        ctx.save()
        ctx.beginPath();ctx.rect(margin.left,margin.top,w,h);ctx.clip()
        ctx.beginPath()
        for(const line of grid.contours)for(const [u1,v1,u2,v2] of line.segments){
          ctx.moveTo(margin.left+w*u1,margin.top+h*v1);ctx.lineTo(margin.left+w*u2,margin.top+h*v2)
        }
        ctx.lineWidth=.8;ctx.strokeStyle=palette.text;ctx.globalAlpha=.35;ctx.stroke();ctx.globalAlpha=1
        ctx.strokeStyle=palette.muted;ctx.lineWidth=.6;ctx.setLineDash([3,4]);ctx.beginPath()
        ctx.moveTo(sx(0),margin.top);ctx.lineTo(sx(0),margin.top+h);ctx.moveTo(margin.left,sy(0));ctx.lineTo(margin.left+w,sy(0));ctx.stroke();ctx.setLineDash([])
        for(const id of visible){
          const color=palette[tones[id]]
          ctx.beginPath()
          for(let i=0;i<=step;i++){
            const p=frames[i]!.points[id]
            if(i===0)ctx.moveTo(sx(p.x),sy(p.y));else ctx.lineTo(sx(p.x),sy(p.y))
          }
          ctx.lineWidth=3.3;ctx.strokeStyle=palette.canvas;ctx.stroke()
          ctx.lineWidth=1.65;ctx.strokeStyle=color;ctx.stroke()
          const p=frames[step]!.points[id]
          if(!outside(p)){
            ctx.beginPath();ctx.arc(sx(p.x),sy(p.y),3.8,0,2*Math.PI);ctx.fillStyle=color;ctx.fill();ctx.lineWidth=1.2;ctx.strokeStyle=palette.canvas;ctx.stroke()
          }
        }
        ctx.strokeStyle=palette.text;ctx.lineWidth=1.4;ctx.beginPath();ctx.arc(sx(start.x),sy(start.y),5.6,0,2*Math.PI);ctx.stroke()
        ctx.restore()
        ctx.fillStyle=palette.muted;ctx.font='10px ui-monospace, monospace'
        for(const v of [plotMin,0,plotMax]){
          ctx.textAlign=v===plotMin?'left':v===plotMax?'right':'center';ctx.fillText(String(v),sx(v),height-8)
          ctx.textAlign='right';ctx.fillText(String(v),margin.left-4,Math.min(height-margin.bottom,Math.max(10,sy(v)+3)))
        }
      }}/>
    <p>{t.placement} <span>{t.start} ({start.x.toFixed(2)}, {start.y.toFixed(2)})</span></p>
  </section>
}
