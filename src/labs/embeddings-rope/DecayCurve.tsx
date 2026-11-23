import type { KeyboardEvent } from 'react'
import { usePlotScrub, usePlotWidth } from '../../components/viz/usePlotInteraction'
import type { DistancePoint, ScalingMode } from '../../engine/labs/embeddings-rope/engine'
import { useI18n } from '../../i18n'
import { ropeVisuals } from '../../i18n/labs/rope-visuals'

const left = 45, top = 12, bottom = 124
const curveColors = { none: 'var(--accent-primary)', pi: 'var(--accent-secondary)', ntk: 'var(--accent-tertiary)', sinusoidal: 'var(--accent-warn)' }

interface Props {
  points: DistancePoint[]
  distance: number
  mode: ScalingMode
  compare: boolean
  onChange: (value: number) => void
}

export function DecayCurve({points, distance, mode, compare, onChange}: Props) {
  const { locale } = useI18n()
  const { ref, width } = usePlotWidth(500)
  const right = width - 20
  const t = ropeVisuals[locale]
  const modes = ['none', 'pi', 'ntk'] as const
  const lines = compare ? [mode, 'sinusoidal'] as const : [...modes.filter(m => m !== mode), mode]
  const values = points.flatMap(p => lines.map(key => p[key]))
  const ymax = Math.max(...values), ymin = Math.min(...values)
  const pad = Math.max((ymax-ymin)*.055,.01)
  const lo = ymin - pad, hi = ymax + pad
  const limit = points[points.length-1]!.distance
  const x = (d: number) => left + (right-left) * d / limit
  const y = (v: number) => bottom - (bottom-top) * (v-lo) / (hi-lo)
  const point = points[distance]!
  const scrub = usePlotScrub(sx => {
    onChange(Math.max(0,Math.min(limit,Math.round((sx-left) * limit / (right-left)))))
  })
  function key(event: KeyboardEvent<SVGSVGElement>) {
    const keys: Record<string, number> = { ArrowLeft: distance - 1, ArrowDown: distance - 1, ArrowRight: distance + 1, ArrowUp: distance + 1, Home: 0, End: limit }
    const n = keys[event.key]
    if (n === undefined) return
    event.stopPropagation()
    event.preventDefault()
    onChange(Math.min(limit,Math.max(0,n)))
  }
  return <section className="rope-decay"><h2>{t.decay}</h2>
    <div className="rope-legend">{lines.map(key => <span key={key}><i style={{color: curveColors[key]}} />{t[key]}</span>)}</div>
    <svg ref={ref} viewBox={`0 0 ${width} 156`} role="slider" tabIndex={0} aria-label={t.offset} aria-valuemin={0}
      aria-valuemax={limit} aria-valuenow={distance} aria-valuetext={`|Δ| = ${distance}, ${t.dot} = ${point[mode].toFixed(4)}`}
      onKeyDown={key} {...scrub}>
      {[0, .5, 1].map(f => {
        const v = lo + f * (hi-lo)
        return <g key={f}><line className="rope-grid-line" x1={left} x2={right} y1={y(v)} y2={y(v)} />
          <text x={left-5} y={y(v)+4} textAnchor="end">{v.toFixed(1)}</text></g>
      })}
      {[0,16,32,48,64].map(d => <text key={d} x={x(d)} y="140" textAnchor="middle">{d}</text>)}
      <text x={(left+right)/2} y="155" textAnchor="middle">|Δ|</text>
      {lines.map(curve => <polyline key={curve} fill="none" stroke={curveColors[curve]} strokeWidth={curve === mode ? 2.2 : 1.5}
        strokeDasharray={curve === mode ? undefined : '4 2'} points={points.map(p => `${x(p.distance)},${y(p[curve])}`).join(' ')} />)}
      <line x1={x(distance)} x2={x(distance)} y1={top} y2={bottom} stroke="var(--text-secondary)" strokeDasharray="2 3" />
      <circle cx={x(distance)} cy={y(point[mode])} r="4.4" fill={curveColors[mode]} stroke="var(--bg-canvas)" strokeWidth="1.4" />
    </svg>
  </section>
}
