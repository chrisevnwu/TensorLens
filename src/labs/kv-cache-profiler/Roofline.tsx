import { useState } from 'react'
import { rooflineTflops, type ProfileResult } from '../../engine/labs/kv-cache-profiler/engine'
import type { HardwareProfile } from '../../engine/labs/kv-cache-profiler/profiles'
import { useI18n } from '../../i18n'
import { kvVisuals } from '../../i18n/labs/kv-visuals'
import { formatPlotValue } from '../../components/viz/LineChart'

export function Roofline({result,hardware}: {result:ProfileResult;hardware:HardwareProfile}) {
  const {locale}=useI18n(), t=kvVisuals[locale]
  const [probe,setProbe]=useState<number|null>(null)
  const minX=Math.floor(Math.log10(Math.min(1,result.decodeAI,result.prefillAI)*.8))
  const maxX=Math.ceil(Math.log10(Math.max(10,result.prefillAI,result.decodeAI,result.ridgeAI)*1.15))
  const minY=Math.floor(Math.log10(rooflineTflops(10**minX,hardware)))
  const maxY=Math.ceil(Math.log10(hardware.peakTflops*1.15))
  const left=43,right=278,top=12,bottom=127
  const x=(ai:number)=>left+(right-left)*(Math.log10(ai)-minX)/(maxX-minX)
  const y=(tf:number)=>bottom-(bottom-top)*(Math.log10(tf)-minY)/(maxY-minY)
  const nearestProbe=Math.min(10**maxX,Math.max(10**minX,probe??result.decodeAI))
  const axes=[minX,Math.floor((minX+maxX)/2),maxX]
  const yTicks=[...new Set([minY,Math.floor((minY+maxY)/2),maxY])]
  const fmt=(v:number)=>formatPlotValue(v)
  return <section className="kv-roof"><h3>{t.roof}</h3>
    <div className="kv-key"><span><i className="kv-prefill"/>{t.prefill}</span><span><i className="kv-decode"/>{t.decode}</span></div>
    <svg viewBox="0 0 296 162" role="slider" tabIndex={0} aria-label={t.probe} aria-valuemin={10**minX}
      aria-valuemax={10**maxX} aria-valuenow={nearestProbe} aria-valuetext={`${fmt(nearestProbe)} FLOP/B, ${fmt(rooflineTflops(nearestProbe,hardware))} TFLOP/s`}
      onPointerDown={event=>{
        const box=event.currentTarget.getBoundingClientRect()
        const pos=(event.clientX-box.left)*296/Math.max(box.width,1)
        setProbe(10**(minX+(maxX-minX)*Math.min(1,Math.max(0,(pos-left)/(right-left)))))
      }} onKeyDown={event=>{
        const values:Record<string,number>={ArrowLeft:nearestProbe/1.5,ArrowRight:nearestProbe*1.5,Home:10**minX,End:10**maxX}
        const v=values[event.key]
        if(v!==undefined){event.preventDefault();event.stopPropagation();setProbe(v)}
      }}>
      {yTicks.map(a=><g key={a}><line x1={left} x2={right} y1={y(10**a)} y2={y(10**a)} stroke="var(--border-strong)"/>
        <text x={left-4} y={y(10**a)+3} textAnchor="end">{fmt(10**a)}</text></g>)}
      {[...new Set(axes)].map(a=><text key={a} x={x(10**a)} y="141" textAnchor="middle">{fmt(10**a)}</text>)}
      <text x={left} y="9">TFLOP/s</text><text x={(left+right)/2} y="158" textAnchor="middle">FLOP/B</text>
      <polyline fill="none" stroke="var(--text-primary)" strokeWidth="1.8" points={[10**minX,result.ridgeAI,10**maxX].map(ai=>`${x(ai)},${y(rooflineTflops(ai,hardware))}`).join(' ')}/>
      <line x1={x(result.ridgeAI)} x2={x(result.ridgeAI)} y1={y(hardware.peakTflops)} y2={bottom} stroke="var(--text-muted)" strokeDasharray="3 3"/>
      <circle className="kv-prefill" cx={x(result.prefillAI)} cy={y(result.prefill.achievedTflops)} r="4.5"><title>{t.prefill} {fmt(result.prefillAI)} FLOP/B</title></circle>
      <rect className="kv-decode" x={x(result.decodeAI)-3.5} y={y(result.decode.achievedTflops)-3.5} width="7" height="7"><title>{t.decode} {fmt(result.decodeAI)} FLOP/B</title></rect>
      {probe!==null&&<circle cx={x(nearestProbe)} cy={y(rooflineTflops(nearestProbe,hardware))} r="6" fill="none" stroke="var(--accent-warn)"/>}
    </svg>
    <p>{t.ridge} <b>{fmt(result.ridgeAI)} FLOP/B</b></p>
    {probe!==null&&<p>{fmt(nearestProbe)} FLOP/B → {fmt(rooflineTflops(nearestProbe,hardware))} TFLOP/s</p>}
  </section>
}
