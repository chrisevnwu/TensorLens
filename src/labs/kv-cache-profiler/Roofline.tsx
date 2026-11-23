import { rooflineTflops, type ProfileResult } from '../../engine/labs/kv-cache-profiler/engine'
import type { HardwareProfile } from '../../engine/labs/kv-cache-profiler/profiles'
import { useI18n } from '../../i18n'
import { kvVisuals } from '../../i18n/labs/kv-visuals'
import { formatPlotValue } from '../../components/viz/LineChart'

import { usePlotScrub, usePlotWidth } from '../../components/viz/usePlotInteraction'

interface Props {
  result:ProfileResult
  hardware:HardwareProfile
  probeAI:number
  onProbeChange:(value:number)=>void
}
export function Roofline({result,hardware,probeAI,onProbeChange}:Props) {
  const {locale}=useI18n(), t=kvVisuals[locale]
  const minX=Math.floor(Math.log10(Math.min(1,result.decodeAI,result.prefillAI)*.8))
  const maxX=Math.ceil(Math.log10(Math.max(10,result.prefillAI,result.decodeAI,result.ridgeAI)*1.15))
  const minY=Math.floor(Math.log10(rooflineTflops(10**minX,hardware)))
  const maxY=Math.ceil(Math.log10(hardware.peakTflops*1.15))
  const { ref, width } = usePlotWidth(296)
  const left=48,right=width-28,top=16,bottom=127
  const x=(ai:number)=>left+(right-left)*(Math.log10(ai)-minX)/(maxX-minX)
  const y=(tf:number)=>bottom-(bottom-top)*(Math.log10(tf)-minY)/(maxY-minY)
  const nearestProbe=Math.min(10**maxX,Math.max(10**minX,probeAI || result.decodeAI))
  const axes=[minX,Math.floor((minX+maxX)/2),maxX]
  const yTicks=[...new Set([minY,Math.floor((minY+maxY)/2),maxY])]
  const fmt=(v:number)=>formatPlotValue(v)
  const scrub = usePlotScrub(position => {
    const fraction = Math.min(1,Math.max(0,(position-left)/(right-left)))
    onProbeChange(10**(minX + (maxX-minX)*fraction))
  })
  return <section className="kv-roof"><h3>{t.roof}</h3>
    <div className="kv-key"><span><i className="kv-prefill"/>{t.prefill}</span><span><i className="kv-decode"/>{t.decode}</span></div>
    <svg ref={ref} viewBox={`0 0 ${width} 162`} role="slider" tabIndex={0} aria-label={t.probe} aria-valuemin={10**minX}
      aria-valuemax={10**maxX} aria-valuenow={nearestProbe} aria-valuetext={`${fmt(nearestProbe)} FLOP/B, ${fmt(rooflineTflops(nearestProbe,hardware))} TFLOP/s`}
      {...scrub} onKeyDown={event=>{
        const values:Record<string,number>={ArrowLeft:nearestProbe/1.5,ArrowRight:nearestProbe*1.5,ArrowUp:nearestProbe*1.5,ArrowDown:nearestProbe/1.5,Home:10**minX,End:10**maxX}
        const v=values[event.key]
        if(v!==undefined){event.preventDefault();event.stopPropagation();onProbeChange(Math.max(10**minX,Math.min(10**maxX,v)))}
      }}>
      {yTicks.map(a=><g key={a}><line x1={left} x2={right} y1={y(10**a)} y2={y(10**a)} stroke="var(--border-strong)"/>
        <text x={left-4} y={y(10**a)+3} textAnchor="end">{fmt(10**a)}</text></g>)}
      {[...new Set(axes)].map(a=><text key={a} x={x(10**a)} y="141" textAnchor="middle">{fmt(10**a)}</text>)}
      <text x={left} y="12">TFLOP/s</text><text x={(left+right)/2} y="158" textAnchor="middle">FLOP/B</text>
      <polyline fill="none" stroke="var(--text-primary)" strokeWidth="1.8" points={[10**minX,result.ridgeAI,10**maxX].map(ai=>`${x(ai)},${y(rooflineTflops(ai,hardware))}`).join(' ')}/>
      <line x1={x(result.ridgeAI)} x2={x(result.ridgeAI)} y1={y(hardware.peakTflops)} y2={bottom} stroke="var(--text-muted)" strokeDasharray="3 3"/>
      <circle className="kv-prefill" cx={x(result.prefillAI)} cy={y(result.prefill.achievedTflops)} r="4.5"><title>{t.prefill} {fmt(result.prefillAI)} FLOP/B</title></circle>
      <rect className="kv-decode" x={x(result.decodeAI)-3.5} y={y(result.decode.achievedTflops)-3.5} width="7" height="7"><title>{t.decode} {fmt(result.decodeAI)} FLOP/B</title></rect>
      {probeAI>0&&<circle cx={x(nearestProbe)} cy={y(rooflineTflops(nearestProbe,hardware))} r="6" fill="none" stroke="var(--accent-warn)"/>}
    </svg>
    <p>{t.ridge} <b>{fmt(result.ridgeAI)} FLOP/B</b></p>
    {probeAI>0&&<p>{fmt(nearestProbe)} FLOP/B → {fmt(rooflineTflops(nearestProbe,hardware))} TFLOP/s</p>}
  </section>
}
