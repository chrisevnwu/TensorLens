import { SegmentedControl } from '../../components/controls'
import { LineChart } from '../../components/viz/LineChart'
import type { DistillFrame } from '../../engine/labs/knowledge-distillation/engine'
import { useI18n } from '../../i18n'
import { distillCopy } from '../../i18n/labs/knowledge-distillation'
import { classes, modes, type State } from './config'
import './distill.css'

interface Props {
  state: State
  trace: DistillFrame[]
  setFocus: (focus: State['focus']) => void
  setView: (view: State['view']) => void
  go: (step: number) => void
}

export function DistillStage({ state, trace, setFocus, setView, go }: Props) {
  const { locale } = useI18n()
  const t = distillCopy[locale]
  const { step, view, focus } = state
  const frame = trace[step]!
  const selected = classes.indexOf(focus)
  const signals = view === 'training'
  const series = signals
    ? [{ name: t.studentAtT, values: frame.student.studentSoft }, { name: t.teacher, values: frame.student.teacherSoft }]
    : [{ name: t.student, values: frame.student.probability }, { name: t.baseline, values: frame.baseline.probability }]
  return <div className="distill-stage">
    <header><h2>{t.question}</h2><p>{t.context}</p></header>
    <SegmentedControl label={t.compare} value={view} options={modes.map(value => ({ value, label: t.modes[value] }))} onChange={setView} />
    <section aria-label={t.focus}>
      <div className="distill-legend">{series.map(row => <span key={row.name}>{row.name}</span>)}</div>
      <div className="distill-cards">{classes.map((instrument, i) =>
        <button type="button" key={instrument} aria-pressed={focus === instrument} aria-label={t.classes[instrument]}
          aria-description={series.map(row => row.name + ' ' + (100 * row.values[i]!).toFixed(1) + '%').join(', ')} onClick={() => setFocus(instrument)}>
          <span className="distill-bars" aria-hidden="true">{series.map(row => <i key={row.name} style={{ height: 100 * row.values[i]! + '%' }} />)}</span>
          <strong>{t.classes[instrument]}</strong>
          <span className="distill-values">{series.map(row => <span key={row.name} title={row.name}>{(100 * row.values[i]!).toFixed(1)}%</span>)}</span>
          {i === 0 && <small>{t.hardLabel}</small>}
        </button>)}</div>
      <p className="distill-scores">{t.scoreHint} <code>[{frame.teacherLogits.join(', ')}]</code></p>
    </section>
    <LineChart label={t.curve.replace('{class}', t.classes[focus])} xLabel={t.step} selectedIndex={step} onSelectIndex={go} series={[
      { label: t.student, color: 'var(--accent-primary)', values: trace.map(f => 100 * f.student.probability[selected]!) },
      { label: t.baseline, color: 'var(--accent-secondary)', dashed: true, values: trace.map(f => 100 * f.baseline.probability[selected]!) },
    ]}/>
  </div>
}
