import { useId } from 'react'
import type { SamplingResult, SamplingStatus } from '../../engine/labs/decoding-sampling/engine'
import type { MonteCarloState } from '../../engine/labs/decoding-sampling/monte-carlo'
import { useI18n } from '../../i18n'
import { samplingVisuals } from '../../i18n/labs/sampling-visuals'

interface Props {result:SamplingResult;tokens:readonly string[];samples:MonteCarloState;step:number;selectedToken:number;onSelectToken:(i:number)=>void}
const statusStep={'kept':0,'top-k':2,'top-p':3,'min-p':4}
const statusColor={'kept':'var(--accent-primary)','top-k':'var(--text-muted)','top-p':'var(--accent-warn)','min-p':'var(--accent-secondary)'}

export function TokenBars({result,tokens,samples,step,selectedToken,onSelectToken}:Props){
  const {locale}=useI18n(),t=samplingVisuals[locale]
  const id=useId().replace(/[^a-z0-9-]/gi,'')
  const values=result.stages[step]!,left=71,right=386,rowHeight=14
  const max=Math.max(.001,...result.baseProbs,...values,...samples.frequencies)
  const x=(p:number)=>left+(right-left)*p/max
  const lastRow=samples.lastIndex===null?0:result.order.indexOf(samples.lastIndex)
  return <section className="sample-bar-section"><h2>{t.distribution}</h2>
    <div className="sample-legend">{(Object.keys(statusColor) as SamplingStatus[]).map(s=><span key={s}><i style={{background:statusColor[s]}}/>{t[s]}</span>)}
      <span><i className="sample-empirical"/>{t.empirical}</span></div>
    <svg className="sample-bars" viewBox={`0 0 450 ${tokens.length*rowHeight+35}`} aria-label={t.distribution}>
      <defs>{(['top-p','min-p'] as const).map(s=><pattern key={s} id={id+s} width="5" height="5" patternUnits="userSpaceOnUse">
        <rect width="5" height="5" fill="var(--bg-elevated)"/><path d="M-1 1L1 -1M0 5L5 0M4 6L6 4" stroke={statusColor[s]} strokeWidth="1"/></pattern>)}</defs>
      {result.order.map((index,rank)=>{
        const phaseStatus=result.statuses[index]!
        const status=step>=statusStep[phaseStatus]?phaseStatus:'kept'
        const bar=status==='kept'?values[index]!:result.baseProbs[index]!
        const f=samples.frequencies[index]!,y=18+rowHeight*rank
        const select=()=>onSelectToken(index)
        return <g key={index} role="button" data-sample-token={index} data-token-id={index} data-empirical-count={samples.counts[index]} tabIndex={0} aria-pressed={index===selectedToken}
          aria-label={`${t.token} ${tokens[index]}`} onClick={select} onFocus={select} onPointerEnter={select}
          onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();select()}}}>
          <title>{tokens[index]} · {t[status]} · p = {values[index]!.toFixed(6)}</title>
          <rect x="0" y={y-6} width="449" height="13" rx="2" fill={index===selectedToken?'var(--bg-elevated)':'transparent'}/>
          <text x={left-6} y={y+3} textAnchor="end">{tokens[index]}</text>
          <rect x={left} y={y-3.5} height="7" width={x(bar)-left} fill={status==='top-p'||status==='min-p'?`url(#${id+status})`:statusColor[status]}/>
          {samples.cursor>0&&<line x1={x(f)} x2={x(f)} y1={y-5.2} y2={y+5.2} stroke="var(--accent-tertiary)" strokeWidth="1.8"/>}
          <text x="447" y={y+3} textAnchor="end">{(values[index]!*100).toFixed(1)}%</text>
        </g>
      })}
      <line x1={x(result.minThreshold)} x2={x(result.minThreshold)} y1="8" y2={tokens.length*rowHeight+12}
        stroke="var(--accent-secondary)" strokeDasharray="3 3" pointerEvents="none"/>
      <text x={x(result.minThreshold)+3} y={tokens.length*rowHeight+28}>Min-P {(100*result.minThreshold).toFixed(1)}%</text>
      <g className="sample-roulette" style={{transform:`translate(0px,${18+lastRow*rowHeight}px)`,opacity:samples.lastIndex===null?0:1}} pointerEvents="none">
        <g key={samples.cursor} className="sample-hit"><path d="m0-4 7 4-7 4z" fill="var(--accent-warn)"/></g>
      </g>
    </svg>
  </section>
}
