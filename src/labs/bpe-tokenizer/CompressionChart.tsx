import type { BpeFrame } from '../../engine/labs/bpe-tokenizer/engine'
import { useI18n } from '../../i18n'
import { bpeVisuals } from '../../i18n/labs/bpe-visuals'

export function CompressionChart({ frames, step }: { frames: BpeFrame[]; step: number }) {
  const { locale } = useI18n()
  const t = bpeVisuals[locale]
  const current = frames[step] ?? frames[0]!
  const maxCount = Math.max(1, ...frames.map(frame => frame.tokenCount))
  const maxRatio = Math.max(1, ...frames.map(frame => frame.charsPerToken))
  const maxStep = frames.length - 1
  const x = (n: number) => 46 + n / Math.max(1, maxStep) * 378
  const y = (value: number, limit: number) => 113 - value / limit * 90
  const series = [
    { key: 'tokenCount', label: t.tokens, limit: maxCount, className: 'bpe-count' },
    { key: 'charsPerToken', label: t.ratio, limit: maxRatio, className: 'bpe-ratio' },
  ] as const
  return <section className="bpe-section bpe-chart">
    <h2>{t.chart}</h2>
    <div className="bpe-chart-legend">{series.map(s => <span key={s.key} className={s.className}>
      <i aria-hidden="true" />{s.label} <b>{s.key === 'tokenCount' ? current.tokenCount : current.charsPerToken.toFixed(2)}</b>
    </span>)}</div>
    <svg viewBox="0 0 470 147" role="img" aria-label={`${t.chart}, ${t.step} ${current.step}`}>
      {[0,.5,1].map(f => <g key={f}>
        <line className="bpe-gridline" x1="46" x2="424" y1={y(f,1)} y2={y(f,1)} />
        <text className="bpe-count" x="38" y={y(f,1)+4} textAnchor="end">{(f*maxCount).toLocaleString(locale, {maximumFractionDigits: 1})}</text>
        <text className="bpe-ratio" x="432" y={y(f,1)+4}>{(f*maxRatio).toFixed(1)}</text>
      </g>)}
      {series.map(s => <g key={s.key} className={s.className}>
        <polyline fill="none" stroke="currentColor" strokeWidth="2.3" points={frames.map(f => `${x(f.step)},${y(f[s.key],s.limit)}`).join(' ')} />
        <circle cx={x(current.step)} cy={y(current[s.key],s.limit)} r="3.5" fill="currentColor" />
      </g>)}
      <line x1={x(current.step)} x2={x(current.step)} y1="15" y2="116" className="bpe-playhead" />
      {[...new Set([0,Math.floor(maxStep/2),maxStep])].map(n => <text key={n} x={x(n)} y="132" textAnchor="middle">{n}</text>)}
      <text x="235" y="146" textAnchor="middle">{t.step}</text>
    </svg>
  </section>
}
