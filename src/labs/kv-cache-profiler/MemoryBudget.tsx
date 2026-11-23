import type { ProfileResult } from '../../engine/labs/kv-cache-profiler/engine'
import { useI18n } from '../../i18n'
import { kvVisuals } from '../../i18n/labs/kv-visuals'
export const gb = (bytes:number) => (bytes/1e9).toLocaleString('en-US',{maximumFractionDigits:2})

export function MemoryBudget({result}: {result:ProfileResult}) {
  const {locale} = useI18n()
  const t = kvVisuals[locale]
  const max = Math.max(result.totalBytes,result.capacityBytes)
  const segments = [
    {label:t.weights,b:result.weightBytes,color:'var(--accent-primary)',start:0},
    {label:'KV',b:result.kvBytes,color:'var(--accent-secondary)',start:result.weightBytes},
    {label:t.activations,b:result.activationBytes,color:'var(--accent-tertiary)',start:result.weightBytes+result.kvBytes},
  ]
  const x=(b:number)=>4+232*b/max
  return <section className="kv-budget"><h3>{t.memory}</h3>
    <svg data-oom={result.isOom} viewBox="0 0 240 40" role="img" aria-label={`${t.total} ${gb(result.totalBytes)} GB / ${gb(result.capacityBytes)} GB`}>
      <rect x="4" y="11" width="232" height="17" rx="2" fill="var(--bg-elevated)"/>
      {segments.map(s=><rect key={s.label} x={x(s.start)} y="11" width={x(s.b)-4} height="17" fill={s.color}><title>{s.label} {gb(s.b)} GB</title></rect>)}
      <line x1={x(result.capacityBytes)} x2={x(result.capacityBytes)} y1="4" y2="34" stroke={result.isOom?'var(--accent-danger)':'var(--text-primary)'} strokeWidth="2"/>
    </svg>
    <dl>{segments.map(s=><div key={s.label}><dt><i style={{background:s.color}}/>{s.label}</dt><dd>{gb(s.b)} GB</dd></div>)}
      <div><dt>{t.capacity}</dt><dd>{gb(result.capacityBytes)} GB</dd></div>
      <div><dt>{t.total}</dt><dd>{gb(result.totalBytes)} GB</dd></div></dl>
    {result.isOom&&<p role="status" className="kv-oom">{t.oom} · +{gb(result.totalBytes-result.capacityBytes)} GB</p>}
  </section>
}
