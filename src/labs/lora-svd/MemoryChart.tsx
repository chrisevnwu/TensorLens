import type { MemoryComparison } from '../../engine/labs/lora-svd/memory'
import { useI18n } from '../../i18n'
import { loraMemoryCopy } from '../../i18n/labs/lora-memory'
import './memory.css'

const keys=['baseBytes','adapterBytes','gradientBytes','optimizerBytes','activationBytes'] as const
const colors=['var(--accent-primary)','var(--accent-secondary)','var(--accent-warn)','var(--accent-tertiary)','var(--accent-danger)']
export function MemoryChart({memory}:{memory:MemoryComparison}) {
  const {locale}=useI18n(), t=loraMemoryCopy[locale]
  const ceiling=Math.max(...memory.rows.map(r=>r.totalBytes))
  const gb=(bytes:number)=>Number((bytes/1e9).toPrecision(4)).toLocaleString(locale,{maximumFractionDigits:6})
  return <section className="lora-memory">
    <h3>{t.title} · {memory.sizeB}B</h3>
    <ul className="lora-mem-legend">{keys.map((key,i)=><li key={key}><i style={{background:colors[i]}}/>{t[key]}</li>)}</ul>
    <div className="lora-mem-bars">{memory.rows.map(row=><div className="lora-mem-row" key={row.method}>
      <span>{t[row.method]}</span>
      <div className="lora-mem-track" role="img" aria-label={`${t[row.method]} · ${gb(row.totalBytes)} GB`}>
        {keys.map((key,i)=><i key={key} title={`${t[key]} · ${gb(row[key])} GB`}
          style={{width:100*row[key]/ceiling+'%',background:colors[i]}}/>)}
      </div>
      <output data-memory-total={row.method} data-bytes={row.totalBytes}>{gb(row.totalBytes)} GB</output>
    </div>)}</div>
    <details><summary>{t.assumptions}</summary>
      <p>{t.sizes.replace('{layers}',String(memory.layers)).replace('{hidden}',String(memory.hidden)).replace('{tokens}',String(memory.sequenceLength))}</p>
      <p>{t.adapters}</p><p>{t.states}</p>
      <table><thead><tr><th>GB</th>{memory.rows.map(r=><th key={r.method}>{t[r.method]}</th>)}</tr></thead>
        <tbody>{keys.map(key=><tr key={key}><th>{t[key]}</th>{memory.rows.map(r=><td key={r.method}>{gb(r[key])}</td>)}</tr>)}
          <tr><th>{t.total}</th>{memory.rows.map(r=><td key={r.method}>{gb(r.totalBytes)}</td>)}</tr></tbody>
      </table>
    </details>
  </section>
}
