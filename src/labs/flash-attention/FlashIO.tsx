import {LineChart,formatPlotValue} from '../../components/viz/LineChart'
import type { FlashResult } from '../../engine/labs/flash-attention/engine'
import type { ScalingPoint } from '../../engine/labs/flash-attention/io'
import { useI18n } from '../../i18n'
import { flashVisuals } from '../../i18n/labs/flash-visuals'

interface Props {
  result:FlashResult
  step:number
  scaling:ScalingPoint[]
  scalingLength:number
  onScalingLengthChange:(length:number)=>void
}
export function FlashIO({result,step,scaling,scalingLength,onScalingLengthChange}:Props){
  const {locale}=useI18n(),t=flashVisuals[locale]
  const selected=scaling.findIndex(point=>point.n===scalingLength)
  const f=result.trace[step]!
  const capacity=Math.max(result.standardBytes,result.flashBytes)
  const point=scaling[selected]!
  return <section className="flash-io"><h3>{t.traffic}</h3>
    {[
      {label:t.soFar,value:f.bytes,color:'var(--accent-primary)'},{label:t.flashTotal,value:result.flashBytes,color:'var(--accent-tertiary)'},
      {label:t.standard,value:result.standardBytes,color:'var(--accent-secondary)'},
    ].map((s,i)=><div className="flash-counter" key={s.label}><span>{s.label}</span><div><i style={{width:`${100*s.value/capacity}%`,background:s.color}}/></div>
      <span><output data-flash-bytes={i===0?'':undefined}>{s.value}</output> B</span></div>)}
    <details><summary>{t.standardPhases}</summary><ol>{result.standardTransfers.map((s,i)=><li key={i}>
      <code>{['Q, K → S','S → P','P, V → O'][i]}</code> · {s.bytes} B</li>)}</ol></details>
    <LineChart label={t.scaling} xLabel={t.sequence} xValues={scaling.map(p=>p.n)} scale="symlog" logThreshold={.001}
      selectedIndex={selected} onSelectIndex={index=>onScalingLengthChange(scaling[index]!.n)} series={[
        {label:t.flashTotal+' (MiB)',color:'var(--accent-primary)',values:scaling.map(p=>p.flashBytes/2**20)},
        {label:t.standard+' (MiB)',color:'var(--accent-secondary)',values:scaling.map(p=>p.standardBytes/2**20)},
      ]}/>
    <p>N = {point.n} · d = {point.d} · Bᵣ = B꜀ = {point.tile} · {t.footprint} {formatPlotValue(point.sramBytes/1024)} KiB</p>
  </section>
}
