import type { ProfileResult } from '../../engine/labs/kv-cache-profiler/engine'
import type { DecodeFrame } from '../../engine/labs/kv-cache-profiler/trace'
import type { HardwareProfile } from '../../engine/labs/kv-cache-profiler/profiles'
import { useI18n } from '../../i18n'
import { kvVisuals } from '../../i18n/labs/kv-visuals'
import { DecodeMatrix, type PathMode } from './DecodeMatrix'
import { MemoryBudget } from './MemoryBudget'
import { Roofline } from './Roofline'
import { formatPlotValue } from '../../components/viz/LineChart'
import './kv.css'

interface Props {
  frame:DecodeFrame
  result:ProfileResult
  hardware:HardwareProfile
  probeAI:number
  onProbeChange:(value:number)=>void
  mode:PathMode
}
export function KvStage({frame,result,hardware,mode,probeAI,onProbeChange}: Props) {
  const {locale}=useI18n(), t=kvVisuals[locale]
  return <div className="kv-stage"><section>
    <h2>{t.trace}<small>{t[frame.phase]} {frame.step||''}</small></h2>
    <div className="kv-key">{(['new','reused','redundant','masked'] as const).map(k=><span key={k}><i className={'kv-'+k}/>{t[k]}</span>)}</div>
    <div className="kv-paths">{(['cached','uncached'] as const).map(path=><DecodeMatrix key={path} {...{path,frame,mode}}/>)}</div>
  </section><div className="kv-profile"><MemoryBudget result={result}/><Roofline {...{result,hardware,probeAI,onProbeChange}}/></div></div>
}

export function KvInspector({frame,result}: Pick<Props,'frame'|'result'>) {
  const {locale}=useI18n(),t=kvVisuals[locale]
  return <div className="kv-inspector"><h3>{t.newest} · ID {frame.tokenIds[frame.length-1]}</h3>
    <p>{t.tokenIds} <code>{frame.tokenIds.join(' · ')}</code></p>
    {(['cached','uncached'] as const).map(p=><div className="kv-output" key={p}>
      <h4>{t[p]}</h4><code>[{frame[p].output.map(v=>v.toFixed(4)).join(', ')}]</code>
      <p>{t.cumulative} <b>{frame[p].cumulativeFlops.toLocaleString(locale)}</b></p>
    </div>)}
    <table><thead><tr><th>{t.phase}</th><th>FLOP/B</th><th>TFLOP/s</th><th>{t.bound}</th></tr></thead>
      <tbody>{(['prefill','decode'] as const).map(phase=><tr key={phase}><th>{t[phase]}</th>
        <td>{formatPlotValue(result[phase].ai)}</td><td>{formatPlotValue(result[phase].achievedTflops)}</td>
        <td>{result[phase].bound==='memory'?t.bandwidth:t.compute}</td></tr>)}</tbody>
    </table>
  </div>
}
