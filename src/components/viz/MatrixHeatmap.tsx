import { useAppStore } from '../../store/useAppStore'
import { divergingColor, sequentialColor } from '../../engine/math/colormaps'

export interface HeatCell { row: number; col: number }
interface Props {
  values: readonly (readonly number[])[]
  label: string
  signed?: boolean
  domain?: number
  selected?: HeatCell
  onSelect?: (cell: HeatCell) => void
}
export function MatrixHeatmap({ values, label, signed = false, domain, selected, onSelect }: Props) {
  const theme = useAppStore(state => state.theme)
  const rows = values.length, cols = values[0]?.length ?? 0
  if (!rows || !cols) return null
  const bound = domain ?? Math.max(1e-12, ...values.flatMap(row => row.map(Math.abs)))
  return <svg className="matrix-heatmap" viewBox={`0 0 ${cols * 10} ${rows * 10}`} role="img" aria-label={label}
    tabIndex={onSelect ? 0 : undefined} onKeyDown={e => {
      if (!onSelect || !['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) return
      e.stopPropagation(); e.preventDefault()
      onSelect({ row: Math.max(0,Math.min(rows-1,(selected?.row ?? 0) + Number(e.key==='ArrowDown') - Number(e.key==='ArrowUp'))),
        col: Math.max(0,Math.min(cols-1,(selected?.col ?? 0) + Number(e.key==='ArrowRight') - Number(e.key==='ArrowLeft'))) })
    }}>
    {values.map((row,r) => row.map((v,c) => <rect key={r+'-'+c} x={c*10+.2} y={r*10+.2} width="9.6" height="9.6" rx=".6"
      fill={signed ? divergingColor(v,bound,theme) : sequentialColor(v / bound,theme)}
      stroke={selected?.row === r && selected.col === c ? 'var(--text-primary)' : 'none'}
      onPointerEnter={() => onSelect?.({row:r,col:c})} onClick={() => onSelect?.({row:r,col:c})}>
      <title>{`[${r}, ${c}] = ${v.toPrecision(5)}`}</title>
    </rect>))}
  </svg>
}
