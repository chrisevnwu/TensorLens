import { useMemo } from 'react'
import { usePlotScrub, usePlotWidth } from '../../components/viz/usePlotInteraction'
import type { NoiseSchedule } from '../../engine/labs/diffusion-flow/fields'
import { alphaBar } from '../../engine/labs/diffusion-flow/fields'
import { scheduleSeries } from '../../engine/labs/diffusion-flow/grid'
import { useI18n } from '../../i18n'
import { noiseChartCopy } from '../../i18n/labs/noise-chart'
import './schedule.css'

interface Props {schedule:NoiseSchedule;numSteps:number;step:number;onStepChange:(n:number)=>void}
export function NoiseChart({schedule,numSteps,step,onStepChange}:Props){
  const {locale}=useI18n(),t=noiseChartCopy[locale]
  const series=useMemo(()=>scheduleSeries(schedule),[schedule])
  const finite=series.flatMap(p=>p.logSnr===null?[]:[{t:p.t,v:p.logSnr}])
  const hi=Math.ceil(finite[0]!.v),lo=Math.floor(finite[finite.length-1]!.v)
  const { ref, width } = usePlotWidth(516)
  const left = 32, right = width - 36
  const x = (time: number) => left + (right-left)*time/100
  const yPower=(a:number)=>108-91*a
  const ySnr=(v:number)=>108-91*(v-lo)/(hi-lo)
  const time=100*(1-step/numSteps),a=alphaBar(schedule,1-step/numSteps)
  const logSnr=a===1?null:Math.log(a)-Math.log1p(-a)
  const val=(n:number)=>String(Number(n.toPrecision(4)))
  const scrub = usePlotScrub(position => {
    const fraction = (position - left) / (right - left)
    onStepChange(Math.max(0, Math.min(numSteps, Math.round((1-fraction)*numSteps))))
  })
  return <section className="noise-chart"><h3>{t.schedule}</h3>
    <div className="noise-key"><span>{t.signal} ᾱ <b>{val(a)}</b></span>
      <span>{t.snr} <b>{logSnr===null?'+∞':val(logSnr)}</b></span></div>
    <svg ref={ref} viewBox={`0 0 ${width} 143`} role="slider" tabIndex={0} aria-label={t.time} aria-valuemin={0} aria-valuemax={100}
      aria-valuenow={Math.round(time*10)/10} aria-valuetext={t.time+' '+val(time)}
      {...scrub}
      onKeyDown={e=>{
        const at:Record<string,number>={ArrowRight:step-1,ArrowUp:step-1,ArrowLeft:step+1,ArrowDown:step+1,Home:numSteps,End:0}
        const n=at[e.key]
        if(n!==undefined){e.preventDefault();e.stopPropagation();onStepChange(Math.max(0,Math.min(numSteps,n)))}
      }}>
      {[0,.5,1].map(v=><g key={v}><line x1="32" x2={right} y1={yPower(v)} y2={yPower(v)} stroke="var(--border-strong)"/>
        <text x="29" textAnchor="end" y={yPower(v)+3}>{v}</text>
        <text x={right+3} y={yPower(v)+3}>{val(lo+(hi-lo)*v)}</text></g>)}
      <polyline fill="none" stroke="var(--accent-primary)" strokeWidth="2" points={series.map(p=>[x(p.t),yPower(p.alphaBar)].join(',')).join(' ')}/>
      <polyline fill="none" stroke="var(--accent-secondary)" strokeWidth="2" points={finite.map(p=>[x(p.t),ySnr(p.v)].join(',')).join(' ')}/>
      <line x1={x(time)} x2={x(time)} y1="12" y2="108" stroke="var(--text-secondary)" strokeDasharray="2 3"/>
      <circle cx={x(time)} cy={yPower(a)} r="3" fill="var(--accent-primary)"/>
      {logSnr!==null&&<circle cx={x(time)} cy={ySnr(logSnr)} r="3" fill="var(--accent-secondary)"/>}
      <text x="32" y="10" fill="var(--accent-secondary)">+∞<title>{t.infinite}</title></text>
      {[0,25,50,75,100].map(v=><text key={v} x={x(v)} y="125" textAnchor="middle">{v}</text>)}
      <text x={(left+right)/2} y="141" textAnchor="middle">{t.time}</text>
    </svg><p>{t.hint}</p>{a===1&&<p>{t.infinite}</p>}
  </section>
}
