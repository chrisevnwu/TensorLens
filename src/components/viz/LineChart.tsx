import type { KeyboardEvent, PointerEvent } from 'react'
import './line-chart.css'

export interface ChartSeries {
  label: string
  color: string
  values: readonly number[]
  dashed?: boolean
}
interface Band {
  label: string
  color: string
  low: readonly number[]
  high: readonly number[]
}
export interface LineChartProps {
  label: string
  xLabel: string
  xValues?: readonly number[]
  series: readonly ChartSeries[]
  band?: Band
  selectedIndex: number
  onSelectIndex?: (index: number) => void
  scale?: 'linear' | 'symlog'
  logThreshold?: number
}

export function formatPlotValue(n: number) {
  const v = Math.abs(n)
  if (n === 0) return '0'
  if (v >= 10000 || v < .001) return n.toExponential(2)
  return String(Number(n.toPrecision(4)))
}

/** Equally spaced observations on a shared y-axis. Symlog retains signs and zero. */
export function LineChart({label,xLabel,xValues,series,band,selectedIndex,onSelectIndex,scale='linear',logThreshold=1}: LineChartProps) {
  const length = series[0]?.values.length ?? 0
  if (!length) return null
  const left=60, right=492, top=14, bottom=111, width=510
  const threshold = Math.max(Number.EPSILON,logThreshold)
  const transform = (v:number) => scale==='symlog' ? Math.sign(v)*Math.log1p(Math.abs(v)/threshold) : v
  const inverse = (v:number) => scale==='symlog' ? Math.sign(v)*threshold*Math.expm1(Math.abs(v)) : v
  const raw = series.flatMap(curve => Array.from(curve.values)).concat(band ? [...band.low,...band.high] : [])
  const lower = transform(Math.min(0,...raw)), upper = transform(Math.max(0,...raw))
  const extent = upper>lower ? upper-lower : 1
  const x = (i:number) => left+(right-left)*i/Math.max(1,length-1)
  const y = (value:number) => bottom-(bottom-top)*(transform(value)-lower)/extent
  const point = Math.min(length-1,Math.max(0,selectedIndex))
  const polyline = (values:readonly number[]) => values.map((v,i) => `${x(i)},${y(v)}`)
  const ticks = [...new Set([lower,(lower+upper)/2,upper,...(lower<0 && upper>0 ? [0] : [])])].sort((a,b)=>a-b)
  // Keep the zero baseline legible when a symmetric-log tick lands beside it.
  const crossesZero = lower < 0 && upper > 0
  const tickValues = ticks.filter(tick => !crossesZero || tick === 0 || Math.abs(tick) / extent > .12)
  function choose(event: PointerEvent<SVGSVGElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    const pos = (event.clientX-rect.left) * width / Math.max(1,rect.width)
    onSelectIndex?.(Math.max(0,Math.min(length-1,Math.round((pos-left)*(length-1)/(right-left)))))
  }
  function navigate(event: KeyboardEvent<SVGSVGElement>) {
    const indices: Record<string,number> = {ArrowLeft:point-1,ArrowDown:point-1,ArrowRight:point+1,ArrowUp:point+1,Home:0,End:length-1}
    const value = indices[event.key]
    if (!onSelectIndex || value===undefined) return
    event.stopPropagation(); event.preventDefault()
    onSelectIndex(Math.max(0,Math.min(length-1,value)))
  }
  return <figure className="numeric-chart">
    <figcaption>{label}</figcaption>
    <div className="numeric-legend">
      {series.map(s=><span key={s.label}><i style={{color:s.color}} />{s.label} <b>{formatPlotValue(s.values[point]!)}</b></span>)}
      {band && <span><i className="numeric-band-key" style={{color:band.color}}/>{band.label}</span>}
    </div>
    <svg viewBox={`0 0 ${width} 146`} role={onSelectIndex?'slider':'img'} tabIndex={onSelectIndex?0:undefined}
      aria-label={label} aria-valuemin={onSelectIndex?0:undefined} aria-valuemax={onSelectIndex?length-1:undefined}
      aria-valuenow={onSelectIndex?point:undefined} aria-valuetext={onSelectIndex?`${xLabel} ${xValues?.[point] ?? point}`:undefined}
      onPointerDown={event=>{if(onSelectIndex){event.currentTarget.setPointerCapture(event.pointerId);choose(event)}}}
      onPointerMove={event=>{if(onSelectIndex && event.currentTarget.hasPointerCapture(event.pointerId))choose(event)}}
      onKeyDown={navigate}>
      {tickValues.map(t=><g key={t}><line className="numeric-grid" x1={left} x2={right} y1={y(inverse(t))} y2={y(inverse(t))}/>
        <text x={left-5} y={y(inverse(t))+3} textAnchor="end">{formatPlotValue(inverse(t))}</text></g>)}
      {band && <polygon fill={band.color} opacity=".19" points={[...polyline(band.high),...polyline(band.low).reverse()].join(' ')} />}
      {series.map(s=><polyline key={s.label} fill="none" stroke={s.color} strokeWidth="2" strokeDasharray={s.dashed?'4 3':undefined} points={polyline(s.values).join(' ')}/>)}
      <line x1={x(point)} x2={x(point)} y1={top} y2={bottom} stroke="var(--text-secondary)" strokeDasharray="2 3"/>
      {series.map(s=><circle key={s.label} cx={x(point)} cy={y(s.values[point]!)} r="3.5" fill={s.color}/>)}
      {[...new Set([0,Math.floor((length-1)/2),length-1])].map(n=><text key={n} x={x(n)} y="128" textAnchor="middle">{xValues?.[n] ?? n}</text>)}
      <text x={(left+right)/2} y="143" textAnchor="middle">{xLabel}</text>
    </svg>
  </figure>
}
