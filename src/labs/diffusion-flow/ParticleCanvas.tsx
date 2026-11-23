import {HiDPICanvas} from '../../components/viz/HiDPICanvas'
import type {Point,TargetPoint} from '../../engine/labs/diffusion-flow/data'
import type {SolverFrame,SolverId} from '../../engine/labs/diffusion-flow/engine'
import type {FieldVector} from '../../engine/labs/diffusion-flow/grid'
import {useI18n} from '../../i18n'
import {diffusionVisuals} from '../../i18n/labs/diffusion-visuals'

interface Props {
  target:TargetPoint[];solver:SolverId;frames:SolverFrame[];step:number;field:FieldVector[];extent:number;
  trails:boolean;selected:number;onSelect:(i:number)=>void;compact:boolean
}
function viewport(width:number,height:number,extent:number) {
  const scale=(Math.min(width,height)-12)/(2*extent)
  const pos=(p:Point)=>[width/2+p.x*scale,height/2-p.y*scale] as const
  return {scale,pos}
}

export function ParticleCanvas({target,solver,frames,step,field,extent,trails,selected,onSelect,compact}:Props){
  const {locale}=useI18n(),t=diffusionVisuals[locale]
  const frame=frames[step]!,initial=frames[0]!.particles[0]!,first=frame.particles[0]!,selectedPoint=frame.particles[selected]!
  const count=frame.particles.length,heroes=trails?Math.min(12,count):0
  return <figure className="diffusion-run" data-solver={solver} data-particle-count={count} data-start-x={initial.x}
    data-start-y={initial.y} data-x={first.x} data-y={first.y} data-mean-distance={frame.meanDistance} data-purity-a={frame.purityA}
    data-straightness={frame.straightness} data-field-count={field.length} data-trail-count={heroes} data-time={frame.time}>
    <figcaption><b>{t[solver]}</b><span>t = {frame.time.toFixed(2)}</span></figcaption>
    <HiDPICanvas label={`${t[solver]} · ${t.swarm}`} style={{height:compact?'auto':265,aspectRatio:compact?'1':undefined}}
      onClick={e=>{
        const box=e.currentTarget.getBoundingClientRect(),{pos}=viewport(box.width,box.height,extent)
        const cx=e.clientX-box.left,cy=e.clientY-box.top
        let nearest=0,dist=Infinity
        frame.particles.forEach((p,i)=>{
          const [x,y]=pos(p),d=(x-cx)**2+(y-cy)**2
          if(d<dist){dist=d;nearest=i}
        })
        onSelect(nearest)
      }} onRender={(ctx,{width,height,palette})=>{
        const {pos,scale}=viewport(width,height,extent)
        ctx.fillStyle=palette.canvas;ctx.fillRect(0,0,width,height)
        ctx.lineWidth=.5;ctx.strokeStyle=palette.grid;ctx.beginPath()
        const lower=Math.ceil(-extent),upper=Math.floor(extent)
        for(let v=lower;v<=upper;v++){
          ctx.moveTo(...pos({x:v,y:-extent}));ctx.lineTo(...pos({x:v,y:extent}))
          ctx.moveTo(...pos({x:-extent,y:v}));ctx.lineTo(...pos({x:extent,y:v}))
        }
        ctx.stroke()
        const length=scale*extent/16
        ctx.strokeStyle=palette.muted;ctx.globalAlpha=.52;ctx.lineWidth=.7;ctx.beginPath()
        for(const v of field){
          if(v.magnitude<1e-12)continue
          const [x,y]=pos(v),nx=v.dx/v.magnitude,ny=-v.dy/v.magnitude
          const ex=x+nx*length,ey=y+ny*length,tail=length*.3
          ctx.moveTo(x,y);ctx.lineTo(ex,ey)
          ctx.lineTo(ex-tail*(nx+.55*ny),ey-tail*(ny-.55*nx));ctx.moveTo(ex,ey)
          ctx.lineTo(ex-tail*(nx-.55*ny),ey-tail*(ny+.55*nx))
        }
        ctx.stroke()
        for(const cls of [0,1] as const){
          ctx.strokeStyle=cls===0?palette.primary:palette.secondary
          ctx.globalAlpha=.74;ctx.lineWidth=1;ctx.beginPath()
          for(const p of target)if(p.label===cls){
            const [x,y]=pos(p),r=compact?1.8:2.4
            ctx.moveTo(x+r,y);ctx.arc(x,y,r,0,2*Math.PI)
          }
          ctx.stroke()
        }
        ctx.strokeStyle=palette.good;ctx.lineWidth=compact?1:1.25;ctx.globalAlpha=.73
        ctx.beginPath()
        for(let h=0;h<heroes;h++){
          const index=Math.floor(h*count/heroes)
          for(let i=0;i<=step;i++){
            const [x,y]=pos(frames[i]!.particles[index]!)
            if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y)
          }
        }
        ctx.stroke()
        ctx.globalAlpha=.86;ctx.fillStyle=palette.text;ctx.beginPath()
        for(const p of frame.particles){
          const [x,y]=pos(p),r=compact?1.25:1.8
          ctx.moveTo(x+r,y);ctx.arc(x,y,r,0,2*Math.PI)
        }
        ctx.fill();ctx.globalAlpha=1
        const [mx,my]=pos(selectedPoint)
        ctx.strokeStyle=palette.warn;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(mx,my,compact?3.8:5,0,2*Math.PI);ctx.stroke()
      }}/>
    <p>#{selected} <code>({selectedPoint.x.toFixed(3)}, {selectedPoint.y.toFixed(3)})</code></p>
  </figure>
}
