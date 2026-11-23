import { MatrixHeatmap, type HeatCell } from '../../components/viz/MatrixHeatmap'
import { inspectCell, type AttentionResult } from '../../engine/labs/attention-debugger/engine'
import { useI18n } from '../../i18n'
import { attentionVisuals } from '../../i18n/labs/attention-visuals'
import { AttentionPipeline, numeric } from './AttentionPipeline'
import { AttentionArcs } from './AttentionArcs'
import { HeadWiring } from './HeadWiring'
import './attention.css'

interface Props {
  result: AttentionResult
  headIndex: number
  step: number
  cell: HeatCell
  onSelectCell: (cell: HeatCell) => void
  onSelectHead: (index: number) => void
}

export function AttentionStage({result,headIndex,step,cell,onSelectCell,onSelectHead}: Props) {
  const { locale } = useI18n()
  const t = attentionVisuals[locale]
  if (!result.tokens.length) return <p>{t.empty}</p>
  const weights = result.heads[headIndex]!.weights
  return <div className="attention-stage">
    <AttentionPipeline {...{result,headIndex,step,cell,onSelectCell}} />
    <section className="attention-overview"><div className="attention-map">
      <h3>{t.heatmap}</h3>
      <div className="attention-map-axis" style={{gridTemplateColumns:`repeat(${result.tokens.length},minmax(0,1fr))`}}>
        {result.tokens.map((name,i)=><span key={i} title={name}>{name}</span>)}
      </div>
      <MatrixHeatmap values={weights.to2D()} label={t.heatmap} domain={1} selected={cell} onSelect={onSelectCell} />
      <div className="attention-pair-readout">{t.query} [{cell.row}] → {t.key} [{cell.col}] <b>{weights.get(cell.row,cell.col).toFixed(4)}</b></div>
    </div><AttentionArcs tokens={result.tokens} weights={weights} cell={cell} onSelect={onSelectCell} /></section>
    <HeadWiring topology={result.topology} headIndex={headIndex} onSelectHead={onSelectHead} />
  </div>
}

export function AttentionInspector({result,headIndex,cell}: Pick<Props,'result'|'headIndex'|'cell'>) {
  const { locale } = useI18n()
  const t = attentionVisuals[locale]
  if (!result.tokens.length) return <p>{t.empty}</p>
  const detail = inspectCell(result,headIndex,cell.row,cell.col)
  const metrics = [
    ['raw',t.raw,detail.rawScore],['scaled',t.scaled,detail.scaledScore],
    ['masked',t.masked,detail.maskedScore],['weight',t.weight,detail.weight],
  ] as const
  return <section className="attention-inspector">
    <h3>{t.inspect}</h3>
    <p className="attention-pair"><span>q[{cell.row}] {result.tokens[cell.row]}</span> → <span>k[{cell.col}] {result.tokens[cell.col]}</span></p>
    <dl>{metrics.map(([key,label,value])=><div key={key}><dt>{label}</dt><dd data-readout={key}>{numeric(value)}</dd></div>)}</dl>
    {[
      {label:`q[${cell.row}]`, values:detail.q}, {label:`k[${cell.col}]`, values:detail.k},
      {label:`${t.terms} · σ²qᵢₘkⱼₘ`, values:detail.terms},
      {label:`${t.contribution} · Aᵢⱼvⱼ`, values:detail.valueContribution},
    ].map(entry=><div className="attention-vector" key={entry.label}>
      <h4>{entry.label}</h4><code>[{entry.values.map(numeric).join(', ')}]</code>
    </div>)}
  </section>
}
