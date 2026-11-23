export interface Metric {
  label: string
  value: string
  hint?: string
  tone?: 'neutral' | 'accent' | 'good' | 'warn' | 'danger'
}
export function MetricCard({ label, value, hint, tone = 'neutral' }: Metric) {
  return <div className="metric-card" data-tone={tone} title={hint}><div>{label}</div><output>{value}</output>{hint && <small>{hint}</small>}</div>
}
