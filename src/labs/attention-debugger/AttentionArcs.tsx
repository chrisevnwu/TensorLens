import type { HeatCell } from '../../components/viz/MatrixHeatmap'
import type { Matrix } from '../../engine/math/matrix'
import { useI18n } from '../../i18n'
import { attentionVisuals } from '../../i18n/labs/attention-visuals'

export function AttentionArcs({tokens, weights, cell, onSelect}: {
  tokens: string[]; weights: Matrix; cell: HeatCell; onSelect: (cell: HeatCell) => void
}) {
  const { locale } = useI18n()
  const t = attentionVisuals[locale]
  const x = (i: number) => (i + .5) * 320 / tokens.length
  const lines = Array.from({length:tokens.length}, (_,r) => tokens.map((_,c) => ({
    r, c, w:weights.get(r,c), d:`M${x(r)} 8 C${x(r)+12} 32 ${x(c)-12} 54 ${x(c)} 78`,
  }))).flat().filter(p => p.w > 0)
  lines.sort((a,b) => Number(a.r === cell.row) - Number(b.r === cell.row))

  function selectToken(kind: 'query' | 'key', index: number) {
    onSelect(kind === 'query' ? {...cell, row:index} : {...cell, col:index})
  }
  function tokenLabels(kind: 'query' | 'key') {
    const selected = kind === 'query' ? cell.row : cell.col
    return <div className="attention-arc-labels" role="group" aria-label={t[kind]}
      style={{gridTemplateColumns:`repeat(${tokens.length}, minmax(0,1fr))`}}>
      {tokens.map((token, i) => <button type="button" key={i} title={token} aria-label={`${t[kind]} ${i}: ${token}`}
        aria-pressed={i === selected} onFocus={() => selectToken(kind, i)}
        onPointerEnter={() => selectToken(kind, i)} onClick={() => selectToken(kind, i)}>{token}</button>)}
    </div>
  }
  return <div className="attention-arcs"><h3>{t.arcs}</h3>
    <div className="attention-arc-plot">
      {tokenLabels('query')}
      <svg viewBox="0 0 320 86" aria-label={t.arcs}>
        {lines.map(({r,c,w,d}) => {
          const selected = r === cell.row && c === cell.col
          const inspect = () => onSelect({row:r,col:c})
          return <path data-arc={`${r}-${c}`} key={r+'-'+c} d={d} fill="none"
            stroke={selected ? 'var(--accent-warn)' : r === cell.row ? 'var(--accent-primary)' : 'var(--accent-secondary)'}
            strokeWidth={.45 + 5.3 * w} opacity={(r === cell.row ? .45 : .12) + .45*w}
            onPointerEnter={inspect} onClick={inspect}><title>{`${tokens[r]} → ${tokens[c]}: ${w.toFixed(6)}`}</title></path>
        })}
        {(['query','key'] as const).map(kind => tokens.map((token,i) => {
          const query = kind === 'query'
          const active = i === (query ? cell.row : cell.col)
          const y = query ? 8 : 78
          const inspect = () => selectToken(kind,i)
          return <g key={kind+i} onPointerEnter={inspect} onClick={inspect}>
            <title>{token}</title>
            <rect x={x(i)-15} y={y-8} width="30" height="16" fill="transparent" />
            <circle cx={x(i)} cy={y} r={active ? 4.6 : 3.7} fill={active ? 'var(--accent-warn)' : query ? 'var(--accent-primary)' : 'var(--accent-secondary)'} />
          </g>
        }))}
      </svg>
      {tokenLabels('key')}
    </div>
  </div>
}
