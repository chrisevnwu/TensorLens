import { useState } from 'react'
import { SegmentedControl } from '../../components/controls'
import { LineChart, formatPlotValue } from '../../components/viz/LineChart'
import type { ResidualResult, ResidualConfig } from '../../engine/labs/norm-residual/engine'
import { useI18n } from '../../i18n'
import { normVisuals } from '../../i18n/labs/norm-visuals'
import './norm.css'

interface StageProps {
  result: ResidualResult
  layer: number
  onLayerChange: (layer: number) => void
  logScale: boolean
  onLogScaleChange: (enabled: boolean) => void
}
export function NormStage({result,layer,onLayerChange,logScale,onLogScaleChange}: StageProps) {
  const { locale } = useI18n()
  const t = normVisuals[locale]
  const {trace} = result
  const shared = { xLabel:t.layer,selectedIndex:layer,onSelectIndex:onLayerChange,scale:logScale?'symlog':'linear' } as const
  return <div className="norm-stage">
    <SegmentedControl label={t.scale} options={[{value:'linear',label:t.linear},{value:'symlog',label:t.symlog}]}
      value={shared.scale} onChange={mode=>onLogScaleChange(mode==='symlog')}/>
    <LineChart {...shared} label={t.forward} series={[{label:'‖xₗ‖₂',color:'var(--accent-primary)',values:trace.map(f=>f.norm)}]}
      band={{label:t.range,color:'var(--accent-secondary)',low:trace.map(f=>f.min),high:trace.map(f=>f.max)}} />
    <LineChart {...shared} logThreshold={.000001} label={t.backward} series={[{
      label:'‖∂xᴸ[0]/∂xₗ‖₂',color:'var(--accent-tertiary)',values:trace.map(f=>f.gradNorm),
    }]} />
    {trace[layer]!.saturated && <p className="norm-clipped">{t.clipped}</p>}
  </div>
}

export function NormInspector({result,layer,normType}: {result:ResidualResult; layer:number; normType:ResidualConfig['normType']}) {
  const { locale } = useI18n()
  const t = normVisuals[locale]
  const [channel,setChannel] = useState(0)
  const frame = result.trace[layer]!
  const series = [
    {label:t.raw,values:frame.x,tone:'var(--accent-primary)'},
    {label:'LayerNorm',values:frame.layerNorm,tone:'var(--accent-secondary)'},
    {label:'RMSNorm',values:frame.rmsNorm,tone:'var(--accent-tertiary)'},
  ]
  const max = Math.max(1e-12,...series.flatMap(s=>s.values.map(Math.abs)))
  return <section className="norm-inspector">
    <h3>{t.slice} · {t.layer} {layer}</h3>
    <label>{t.channel} <select value={channel} onChange={event=>setChannel(Number(event.target.value))}>
      {frame.x.map((_,i)=><option value={i} key={i}>{i}</option>)}
    </select></label>
    <svg viewBox="0 0 270 282" role="img" aria-label={`${t.slice} · ${t.layer} ${layer}`}>
      {series.map((s,c)=>{
        const center=51+c*87
        return <g key={s.label}><text x={center} y="11" textAnchor="middle" fill={s.tone}>{s.label}</text>
          <line x1={center} x2={center} y1="16" y2="278" stroke="var(--border-strong)"/>
        </g>
      })}
      {frame.x.map((_,i)=><g key={i} data-channel={i} onPointerEnter={()=>setChannel(i)} onClick={()=>setChannel(i)}>
        <rect x="0" y={17+i*8.1} width="270" height="8.1" fill={i===channel?'var(--bg-elevated)':'transparent'}/>
        {(i%8===0||i===31)&&<text x="1" y={23+i*8.1} fill="var(--text-secondary)">{i}</text>}
        {series.map((s,c)=>{
          const value=s.values[i]!,center=51+c*87,end=center+value/max*37
          return <line key={s.label} x1={center} x2={end} y1={21+i*8.1} y2={21+i*8.1} stroke={s.tone} strokeWidth={i===channel?3.9:2.6}/>
        })}
      </g>)}
    </svg>
    <dl>{series.map(s=><div key={s.label} data-active={s.label.toLowerCase()===normType}>
      <dt>{s.label} [{channel}]</dt><dd>{formatPlotValue(s.values[channel]!)}</dd></div>)}</dl>
    <div className="norm-stats">{[[t.mean,frame.mean],[t.std,frame.std],[t.fraction,frame.cosine]].map(([label,v])=>
      <div key={label}><span>{label}</span> <code>{formatPlotValue(Number(v))}</code></div>)}</div>
  </section>
}
