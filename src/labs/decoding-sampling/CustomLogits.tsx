import type { PointerEvent } from 'react'
import { useI18n } from '../../i18n'
import { samplingVisuals } from '../../i18n/labs/sampling-visuals'
export function CustomLogits({tokens,logits,onChange,onSelect}:{
  tokens:readonly string[];logits:readonly number[];onChange:(i:number,v:number)=>void;onSelect:(i:number)=>void
}){
  const {locale}=useI18n(),t=samplingVisuals[locale]
  function drag(event:PointerEvent<SVGSVGElement>,i:number){
    const box=event.currentTarget.getBoundingClientRect()
    const fraction=Math.min(1,Math.max(0,(event.clientX-box.left)/Math.max(box.width,1)))
    onChange(i,Math.round((-12+fraction*24)*10)/10)
  }
  return <section className="custom-logits"><h3>{t.drag}</h3><div>{logits.map((v,i)=><label key={i}>
    <span>{tokens[i]}</span><svg role="slider" tabIndex={0} aria-label={`${t.logit} · ${tokens[i]}`} aria-valuemin={-12} aria-valuemax={12} aria-valuenow={v}
      viewBox="0 0 100 13" preserveAspectRatio="none" onFocus={()=>onSelect(i)} onPointerDown={event=>{
        event.currentTarget.setPointerCapture(event.pointerId);onSelect(i);drag(event,i)
      }} onPointerMove={event=>{if(event.currentTarget.hasPointerCapture(event.pointerId))drag(event,i)}}
      onKeyDown={e=>{
        const d:Record<string,number>={ArrowLeft:v-.1,ArrowDown:v-.1,ArrowRight:v+.1,ArrowUp:v+.1,Home:-12,End:12}
        const value=d[e.key]
        if(value!==undefined){e.preventDefault();e.stopPropagation();onChange(i,Math.round(Math.max(-12,Math.min(12,value))*10)/10)}
      }}>
      <rect x="0" y="4" width="100" height="5" fill="var(--bg-elevated)"/>
      <rect x={Math.min(50,50+v*50/12)} y="4" width={Math.abs(v)*50/12} height="5" fill={v<0?'var(--accent-secondary)':'var(--accent-primary)'}/>
      <line x1="50" x2="50" y1="1" y2="12" stroke="var(--text-muted)"/>
    </svg><output>{v.toFixed(1)}</output>
  </label>)}</div></section>
}
