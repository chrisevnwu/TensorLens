import { useI18n } from '../../i18n'
import { chartCopy } from '../../i18n/charts'
import type { HeatCell } from './MatrixHeatmap'
import './matrix-picker.css'

interface Props {
  rows: number
  cols: number
  cell: HeatCell
  onSelect: (cell: HeatCell) => void
}

/** The picker uses the same zero-based indices as the matrix readouts and URL. */
export function MatrixCellPicker({ rows, cols, cell, onSelect }: Props) {
  const { locale } = useI18n()
  const t = chartCopy[locale]
  return <div className="matrix-picker" role="group" aria-label={t.cell}>
    {([{ key: 'row', label: t.row, count: rows }, { key: 'col', label: t.column, count: cols }] as const).map(axis =>
      <label key={axis.key}>{axis.label}
        <select value={cell[axis.key]}
          onChange={event => onSelect({ ...cell, [axis.key]: Number(event.currentTarget.value) })}>
          {Array.from({ length: axis.count }, (_, i) => <option key={i} value={i}>{i}</option>)}
        </select>
      </label>)}
  </div>
}
