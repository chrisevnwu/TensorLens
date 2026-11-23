import { SegmentedControl } from '../../components/controls'
import { LineChart, type ChartSeries } from '../../components/viz/LineChart'
import { trainPreferences, VOTES } from '../../engine/labs/preference-dpo/engine'
import { useI18n } from '../../i18n'
import { dpoCopy } from '../../i18n/labs/preference-dpo'
import { modes, type State } from './config'
import './dpo.css'

type Trace = ReturnType<typeof trainPreferences>

function OddsBar({ label, probability }: { label: string; probability: number }) {
  const value = 100 * probability
  return <div className="dpo-odds">
    <div><span>{label}</span><strong>A {value.toFixed(1)}% · B {(100 - value).toFixed(1)}%</strong></div>
    <div className="dpo-track" aria-hidden="true"><i style={{ width: value + '%' }} /></div>
  </div>
}

interface Props {
  state: State
  trace: Trace
  setStep: (step: number) => void
  setView: (view: State['view']) => void
}

export function DpoStage({ state, trace, setStep, setView }: Props) {
  const { locale } = useI18n()
  const t = dpoCopy[locale]
  const { view, votesA, referencePercentA, step } = state
  const frame = trace[step]!
  const fit = view === 'fit'
  const series: ChartSeries[] = view === 'loss'
    ? [{ label: t.lossSeries, color: 'var(--accent-primary)', values: trace.map(f => f.loss) }]
    : [
      { label: fit ? t.fitSeries : t.policySeries, color: 'var(--accent-primary)',
        values: trace.map(f => 100 * (fit ? f.predictedVoteA : f.probabilityA)) },
      { label: fit ? t.voteSeries : t.referenceSeries, color: 'var(--accent-secondary)', dashed: true,
        values: trace.map(() => fit ? 100 * votesA / VOTES : referencePercentA) },
    ]
  const chartLabel = view === 'loss' ? t.lossCurve : fit ? t.fitCurve : t.policyCurve
  return <div className="dpo-stage">
    <div className="dpo-pair">
      <h2>{t.prompt}</h2><p>{t.context}</p>
      <div className="dpo-answers">
        {(['A', 'B'] as const).map(answer => <article key={answer}>
          <b>{answer}</b><p>{answer === 'A' ? t.answerA : t.answerB}</p>
          <span>{t.voteCount.replace('{count}', String(answer === 'A' ? votesA : VOTES - votesA)).replace('{answer}', answer)}</span>
        </article>)}
      </div>
    </div>
    <section className="dpo-distribution">
      <h3>{t.generation}</h3>
      <OddsBar label={t.reference} probability={referencePercentA / 100} />
      <OddsBar label={t.policyNow} probability={frame.probabilityA} />
    </section>
    <section className="dpo-trajectory">
      <SegmentedControl label={t.plot} value={view} options={modes.map(value => ({ value, label: t.modes[value] }))} onChange={setView} />
      <LineChart label={chartLabel} xLabel={t.step} series={series} selectedIndex={step} onSelectIndex={setStep} />
    </section>
  </div>
}
