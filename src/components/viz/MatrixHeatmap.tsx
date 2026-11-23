import { useId, type KeyboardEvent } from 'react'
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
  const hatch = useId().replace(/[^a-z0-9-]/gi, '') + '-mask'
  const rows = values.length, cols = values[0]?.length ?? 0
  if (!rows || !cols) return null
  const bound = domain ?? values.reduce((max, row) =>
    row.reduce((limit, value) => Number.isFinite(value) ? Math.max(limit, Math.abs(value)) : limit, max), 1e-12)

  function color(value: number) {
    if (!Number.isFinite(value)) return 'url(#' + hatch + ')'
    return signed ? divergingColor(value, bound, theme) : sequentialColor(value / Math.max(bound, 1e-12), theme)
  }
  function navigate(event: KeyboardEvent<SVGSVGElement>) {
    const delta: Record<string, [number,number]> = { ArrowUp:[-1,0], ArrowDown:[1,0], ArrowLeft:[0,-1], ArrowRight:[0,1] }
    const offset = delta[event.key]
    if (!onSelect || !offset) return
    event.stopPropagation()
    event.preventDefault()
    onSelect({
      row: Math.max(0, Math.min(rows-1, (selected?.row ?? 0) + offset[0])),
      col: Math.max(0, Math.min(cols-1, (selected?.col ?? 0) + offset[1])),
    })
  }
  return <svg className="matrix-heatmap" viewBox={`0 0 ${cols * 10} ${rows * 10}`} role="img" aria-label={label}
    tabIndex={onSelect ? 0 : undefined} onKeyDown={navigate}>
    <defs><pattern id={hatch} width="4" height="4" patternUnits="userSpaceOnUse">
      <rect width="4" height="4" fill="var(--bg-elevated)" /><path d="M-1 1L1 -1M0 4L4 0M3 5L5 3" stroke="var(--text-muted)" strokeWidth=".6" />
    </pattern></defs>
    {values.map((row,r) => row.map((value,c) =>
      <rect key={r+'-'+c} data-row={r} data-col={c} x={c*10+.2} y={r*10+.2} width="9.6" height="9.6" rx=".6" fill={color(value)}
        stroke={selected?.row === r && selected.col === c ? 'var(--text-primary)' : 'none'}
        onPointerEnter={() => onSelect?.({row:r,col:c})} onClick={() => onSelect?.({row:r,col:c})}>
        <title>{`[${r}, ${c}] = ${value === -Infinity ? '−∞' : value.toPrecision(5)}`}</title>
      </rect>))}
  </svg>
}
