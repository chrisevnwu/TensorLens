import type {SamplingResult} from '../../engine/labs/decoding-sampling/engine'
import type {MonteCarloState} from '../../engine/labs/decoding-sampling/monte-carlo'
import {useI18n} from '../../i18n'
import {samplingVisuals} from '../../i18n/labs/sampling-visuals'
import {TokenBars} from './TokenBars'
import {CustomLogits} from './CustomLogits'
import './sampling.css'
interface Props {
  result:SamplingResult;tokens:readonly string[];samples:MonteCarloState;topP:number;step:number;
  onSample:(n:1|100)=>void;onClear:()=>void;onSelectToken:(i:number)=>void;selectedToken:number;
  custom:boolean;logits:readonly number[];onLogitChange:(i:number,v:number)=>void
}
export function SampleStage(p:Props){
  const {locale}=useI18n(),t=samplingVisuals[locale]
  const {result,samples,topP}=p
  const x=(i:number)=>32+402*(i+1)/result.order.length,y=(prob:number)=>89-71*prob
  return <div className="sample-stage">
    <TokenBars {...p}/>
    <div className="sample-actions"><button data-draw-count="1" onClick={()=>p.onSample(1)}>{t.draw}</button>
      <button data-draw-count="100" onClick={()=>p.onSample(100)}>{t.batch}</button>
      <button data-clear-samples="" disabled={!samples.cursor} onClick={p.onClear}>{t.clear}</button>
      <span>{t.draws} <output data-sample-count="">{samples.cursor}</output></span>
    </div>
    {samples.lastIndex!==null&&<p>{t.last} <output data-last-token={samples.lastIndex}>{p.tokens[samples.lastIndex]}</output></p>}
    <section className="sample-cdf"><h3>{t.mass}</h3>
      <svg viewBox="0 0 450 116" role="img" aria-label={t.mass}>
        {[0,.5,1].map(v=><g key={v}><line x1="32" x2="434" y1={y(v)} y2={y(v)} stroke="var(--border-strong)"/>
          <text x="27" y={y(v)+3} textAnchor="end">{v*100}%</text></g>)}
        <polyline points={['32,89',...result.cumulative.map((v,i)=>`${x(i)},${y(v)}`)].join(' ')} fill="none" stroke="var(--accent-tertiary)" strokeWidth="2"/>
        <line x1="32" x2="434" y1={y(topP)} y2={y(topP)} stroke="var(--accent-warn)" strokeDasharray="4 3"/>
        <text x="434" y={y(topP)-4} textAnchor="end">Top-P {(100*topP).toFixed(1)}%</text>
        {[...new Set([0,Math.max(0,Math.floor(result.order.length/2)-1),result.order.length-1])].map(i=><text key={i} x={x(i)} y="104" textAnchor="middle">{i+1}</text>)}
        <text x="225" y="115" textAnchor="middle">{t.rank}</text>
      </svg></section>
    {p.custom&&<CustomLogits logits={p.logits} tokens={p.tokens} onChange={p.onLogitChange} onSelect={p.onSelectToken}/>}
  </div>
}
interface InspectorProps {
  result:SamplingResult;tokens:readonly string[];samples:MonteCarloState;selectedToken:number;
  logits:readonly number[];priorCounts:readonly number[]
}
export function SampleInspector({result,tokens,samples,selectedToken:i,logits,priorCounts}:InspectorProps){
  const {locale}=useI18n(),t=samplingVisuals[locale]
  const rows=[
    [t.logit,logits[i]],[t.adjusted,result.adjustedLogits[i]!.toFixed(5)],[t.prior,priorCounts[i]],
    [t.base,result.baseProbs[i]!.toFixed(6)],[t.final,result.probabilities[i]!.toFixed(6)],
    [t.status,t[result.statuses[i]!]],[t.count,samples.counts[i]],[t.empirical,samples.frequencies[i]!.toFixed(6)],
  ]
  return <section className="sample-inspector"><h3>{t.token} · {tokens[i]}</h3>
    <dl>{rows.map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
  </section>
}
