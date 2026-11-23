import type { HeatCell } from '../../components/viz/MatrixHeatmap'
import type { Matrix } from '../../engine/math/matrix'
import { useI18n } from '../../i18n'
import { attentionVisuals } from '../../i18n/labs/attention-visuals'

export function AttentionArcs({tokens, weights, cell, onSelect}: {
  tokens: string[]; weights: Matrix; cell: HeatCell; onSelect: (cell: HeatCell) => void
}) {
  const { locale } = useI18n()
  const t = attentionVisuals[locale]
  const x = (i: number) => tokens.length > 1 ? 24 + i * 272 / (tokens.length - 1) : 160
  const lines = Array.from({length:tokens.length}, (_,r) => tokens.map((_,c) => ({
    r, c, w:weights.get(r,c), d:`M${x(r)} 29 C${x(r)+12} 53 ${x(c)-12} 67 ${x(c)} 92`,
  }))).flat().filter(p => p.w > 0)
  lines.sort((a,b) => Number(a.r === cell.row) - Number(b.r === cell.row))
  return <div className="attention-arcs"><h3>{t.arcs}</h3>
    <svg viewBox="0 0 320 120" aria-label={t.arcs}>
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
        const inspect = () => onSelect(query ? {...cell,row:i} : {...cell,col:i})
        const y = query ? 28 : 93
        return <g key={kind+i} role="button" tabIndex={0} aria-label={`${t[kind]} ${i}: ${token}`}
          onFocus={inspect} onPointerEnter={inspect} onClick={inspect}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') {e.preventDefault(); e.stopPropagation(); inspect()} }}>
          <title>{token}</title>
          <rect x={x(i)-15} y={y-10} width="30" height="20" fill="transparent" />
          <circle cx={x(i)} cy={y} r={active ? 4.6 : 3.7} fill={active ? 'var(--accent-warn)' : query ? 'var(--accent-primary)' : 'var(--accent-secondary)'} />
          <text x={x(i)} y={query ? 14 : 110} textAnchor="middle">{Array.from(token).slice(0,6).join('')}{Array.from(token).length>6?'…':''}</text>
        </g>
      }))}
    </svg>
  </div>
}
