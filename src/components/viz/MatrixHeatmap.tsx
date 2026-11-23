import { useId, useLayoutEffect, useMemo, useRef, type KeyboardEvent } from 'react'
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
  const id = useId().replace(/[^a-z0-9-]/gi, '')
  const hatch = id + '-mask'
  const interactive = Boolean(onSelect)
  const rows = values.length, cols = values[0]?.length ?? 0
  const selectionHandler = useRef(onSelect)
  useLayoutEffect(() => { selectionHandler.current = onSelect }, [onSelect])
  const cells = useMemo(() => {
    const bound = domain ?? values.reduce((max, row) =>
      row.reduce((limit, value) => Number.isFinite(value) ? Math.max(limit, Math.abs(value)) : limit, max), 1e-12)
    function color(value: number) {
      if (!Number.isFinite(value)) return 'url(#' + hatch + ')'
      return signed ? divergingColor(value, bound, theme) : sequentialColor(value / Math.max(bound, 1e-12), theme)
    }
    return values.map((row,r) => <g key={r} role={interactive ? 'row' : undefined} aria-rowindex={interactive ? r+1 : undefined}>
      {row.map((value,c) =>
      <rect key={r+'-'+c} id={interactive ? id+'-'+r+'-'+c : undefined}
        role={interactive ? 'gridcell' : undefined} aria-colindex={interactive ? c+1 : undefined}
        data-row={r} data-col={c} x={c*10+.2} y={r*10+.2} width="9.6" height="9.6" rx=".6" fill={color(value)}
        onPointerEnter={event => { if (event.pointerType !== 'touch') selectionHandler.current?.({row:r,col:c}) }}
        onClick={() => selectionHandler.current?.({row:r,col:c})}>
        <title>{`[${r}, ${c}] = ${value === -Infinity ? '−∞' : value.toPrecision(5)}`}</title>
      </rect>)}
    </g>)
  }, [domain, hatch, id, interactive, signed, theme, values])
  if (!rows || !cols) return null

  function navigate(event: KeyboardEvent<SVGSVGElement>) {
    const delta: Record<string, [number,number]> = { ArrowUp:[-1,0], ArrowDown:[1,0], ArrowLeft:[0,-1], ArrowRight:[0,1] }
    const offset = delta[event.key]
    if (!onSelect) return
    if (event.key === 'Home' || event.key === 'End') {
      event.stopPropagation()
      event.preventDefault()
      const end = event.key === 'End'
      onSelect({ row: event.ctrlKey ? (end ? rows-1 : 0) : selected?.row ?? 0, col: end ? cols-1 : 0 })
      return
    }
    if (!offset) return
    event.stopPropagation()
    event.preventDefault()
    onSelect({
      row: Math.max(0, Math.min(rows-1, (selected?.row ?? 0) + offset[0])),
      col: Math.max(0, Math.min(cols-1, (selected?.col ?? 0) + offset[1])),
    })
  }
  return <svg className="matrix-heatmap" viewBox={`0 0 ${cols * 10} ${rows * 10}`} role={interactive ? 'grid' : 'img'} aria-label={label}
    aria-readonly={interactive ? true : undefined} aria-rowcount={interactive ? rows : undefined}
    aria-colcount={interactive ? cols : undefined}
    aria-activedescendant={interactive && selected ? id+'-'+selected.row+'-'+selected.col : undefined}
    tabIndex={onSelect ? 0 : undefined} onKeyDown={navigate}>
    <defs><pattern id={hatch} width="4" height="4" patternUnits="userSpaceOnUse">
      <rect width="4" height="4" fill="var(--bg-elevated)" /><path d="M-1 1L1 -1M0 4L4 0M3 5L5 3" stroke="var(--text-muted)" strokeWidth=".6" />
    </pattern></defs>
    {cells}
    {selected && <g aria-hidden="true" pointerEvents="none" transform={`translate(${selected.col*10},${selected.row*10})`} fill="none">
      <rect x=".6" y=".6" width="8.8" height="8.8" stroke="var(--bg-canvas)" strokeWidth="3" vectorEffect="non-scaling-stroke" />
      <rect x=".6" y=".6" width="8.8" height="8.8" stroke="var(--text-primary)" strokeWidth="1.3" vectorEffect="non-scaling-stroke" />
    </g>}
  </svg>
}
