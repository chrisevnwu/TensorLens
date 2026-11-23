import type { AttentionResult } from '../../engine/labs/attention-debugger/engine'
import { useI18n } from '../../i18n'
import { attentionVisuals } from '../../i18n/labs/attention-visuals'

export function HeadWiring({ topology, headIndex, onSelectHead }: {
  topology: AttentionResult['topology']; headIndex: number; onSelectHead: (index: number) => void
}) {
  const { locale } = useI18n()
  const t = attentionVisuals[locale]
  const x = (index: number, length: number) => 18 + (index + .5) * 332 / length
  return <section className="head-wiring"><h2>{t.topology}<small>{t.params} {topology.kvParameters}</small></h2>
    <svg viewBox="0 0 368 80" aria-label={t.topology}>
      {topology.links.map((kv,i) => <path key={i} d={`M${x(i,topology.links.length)} 21 C${x(i,topology.links.length)} 42 ${x(kv,topology.numKvHeads)} 40 ${x(kv,topology.numKvHeads)} 58`}
        fill="none" stroke={i===headIndex?'var(--accent-primary)':'var(--border-strong)'} strokeWidth={i===headIndex?2.3:1.5} />)}
      {topology.links.map((_,i) => <g key={i} role="button" data-query-head={i} tabIndex={0} aria-label={`Q ${i}`} aria-pressed={headIndex===i}
        onClick={()=>onSelectHead(i)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();onSelectHead(i)}}}>
        <rect x={x(i,topology.links.length)-20} y="4" width="40" height="19" rx="4" stroke={headIndex===i?'var(--accent-primary)':'var(--border-strong)'} />
        <text x={x(i,topology.links.length)} y="17" textAnchor="middle">Q{i}</text>
      </g>)}
      {Array.from({length:topology.numKvHeads},(_,i)=><g key={i}>
        <rect x={x(i,topology.numKvHeads)-23} y="56" width="46" height="19" rx="4" stroke={i===topology.links[headIndex]?'var(--accent-secondary)':'var(--border-strong)'} />
        <text x={x(i,topology.numKvHeads)} y="69" textAnchor="middle">KV{i}</text>
      </g>)}
    </svg>
  </section>
}
