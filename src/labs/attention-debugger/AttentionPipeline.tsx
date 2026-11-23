import { MatrixHeatmap, type HeatCell } from '../../components/viz/MatrixHeatmap'
import type { AttentionResult } from '../../engine/labs/attention-debugger/engine'
import type { Matrix } from '../../engine/math/matrix'
import { useI18n } from '../../i18n'
import { attentionVisuals } from '../../i18n/labs/attention-visuals'

export const numeric = (x: number) => Number.isFinite(x) ? x.toFixed(3) : '−∞'

export function AttentionPipeline({result, headIndex, step, cell, onSelectCell}: {
  result: AttentionResult; headIndex: number; step: number; cell: HeatCell; onSelectCell: (cell: HeatCell) => void
}) {
  const { locale } = useI18n()
  const t = attentionVisuals[locale]
  const h = result.heads[headIndex]!
  const stages: {name: string; matrix: Matrix; pair?: boolean}[][] = [
    [{name:'X', matrix:result.X}],
    [{name:'Q',matrix:h.Q},{name:'K',matrix:h.K},{name:'V',matrix:h.V}],
    [{name:'σ²QKᵀ',matrix:h.raw,pair:true}],
    [{name:'S′',matrix:h.scaled,pair:true},{name:'S′ + M',matrix:h.masked,pair:true}],
    [{name:'A',matrix:h.weights,pair:true}],
    [{name:'AV',matrix:h.output},{name:'Concat',matrix:result.concat},{name:'Concat · Wₒ',matrix:result.output}],
  ]
  return <section className="attention-pipeline"><h2>{step + 1}. {t.pipeline[step]}</h2>
    <div className="attention-tensors">{stages[step]!.map(({name,matrix,pair}) => {
      const grid = matrix.to2D()
      return <div key={name} className="attention-tensor">
        <h3>{name}<small>{matrix.rows} × {matrix.cols}</small></h3>
        {step !== 4 && <MatrixHeatmap label={name} values={grid} signed selected={pair ? cell : undefined} onSelect={pair ? onSelectCell : undefined} />}
        {step === 4 && <output>{t.rowSum} [{cell.row}] = {h.weights.row(cell.row).reduce((sum,x) => sum+x,0).toFixed(6)}</output>}
        <details><summary>{t.numbers}</summary><div className="attention-number-scroll">
          <table aria-label={name}><tbody>{grid.map((row,i) => <tr key={i}>{row.map((v,j) => <td key={j}>{numeric(v)}</td>)}</tr>)}</tbody></table>
        </div></details>
      </div>
    })}</div>
  </section>
}
