import { useMemo } from 'react'
import { SliderControl } from '../../components/controls'
import { ExperimentShell } from '../../components/layout/ExperimentShell'
import { useLabUrlState } from '../../components/utils/useLabUrlState'
import { FormulaBar } from '../../components/viz/FormulaBar'
import { trainPreferences, UPDATES, VOTES, type DpoConfig } from '../../engine/labs/preference-dpo/engine'
import { useI18n } from '../../i18n'
import { dpoCopy } from '../../i18n/labs/preference-dpo'
import { codec, initial, presetIds, presetState } from './config'
import { DpoStage } from './DpoStage'

export default function PreferenceLab() {
  const { locale } = useI18n()
  const t = dpoCopy[locale]
  const { state, setState, getShareUrl } = useLabUrlState(initial, codec)
  const { votesA, referencePercentA, beta, rate, step, view } = state
  const trace = useMemo(() => trainPreferences({ votesA, referencePercentA, beta, rate }), [votesA, referencePercentA, beta, rate])
  const frame = trace[step]!
  function configure(changes: Partial<DpoConfig>) {
    setState(current => ({ ...current, ...changes, step: 0 }))
  }
  const go = (next: number) => setState(current => ({ ...current, step: next }))
  return <ExperimentShell labId="preference-dpo" step={step} maxStep={UPDATES} onStepChange={go}
    intervalMs={240} getShareUrl={getShareUrl} onReset={() => setState(presetState(state.preset))}
    presets={presetIds.map(id => ({ id, label: t.presets[id], active: state.preset === id, onSelect: () => setState(presetState(id)) }))}
    controls={<>
      <SliderControl label={t.votesA} min={0} max={VOTES} value={votesA} onChange={value => configure({ votesA: value })} />
      <SliderControl label={t.referenceA} min={5} max={95} value={referencePercentA} format={v => v + '%'} onChange={value => configure({ referencePercentA: value })} />
      <SliderControl label={t.beta} min={.1} max={2} step={.1} value={beta} format={v => v.toFixed(1)} onChange={value => configure({ beta: value })} />
      <SliderControl label={t.rate} min={.05} max={1} step={.05} value={rate} format={v => v.toFixed(2)} onChange={value => configure({ rate: value })} />
    </>}
    formula={<FormulaBar tex={String.raw`m=\beta(\theta-\theta_{\rm ref}),\quad P(A\succ B)=\sigma(m)`}/>}
    stage={<DpoStage state={state} trace={trace} setStep={go} setView={next => setState(s => ({ ...s, view: next }))} />}
    metrics={[
      { label: t.lossMetric, value: frame.loss.toFixed(4), tone: 'accent' },
      { label: t.predictedMetric, value: (100 * frame.predictedVoteA).toFixed(1) + '%' },
      { label: t.klMetric, value: frame.kl.toFixed(4), hint: t.klHint },
      { label: t.marginMetric, value: frame.margin.toFixed(3), hint: t.marginHint },
    ]}
    inspector={<section className="dpo-calculation"><h3>{t.computation}</h3><dl>
      {([[t.theta, frame.logOdds], [t.gradient, frame.gradient], [t.ifA, frame.lossIfA], [t.ifB, frame.lossIfB]] as const).map(([label, value]) =>
        <div key={label}><dt>{label}</dt><dd>{value.toFixed(4)}</dd></div>)}
    </dl><span>{t.update}</span><code> θ ← θ − η ∂L/∂θ</code></section>}
    explainer={<><p>{t.guide}</p><p>{t.fitGuide}</p><p>{t.scaleGuide}</p></>}
    challenges={[
      { id: 'consensus', ...t.missions.consensus, completed: votesA === VOTES && step > 0 && frame.probabilityA >= .9 },
      { id: 'split', ...t.missions.split, completed: votesA === 15 && view === 'fit' && Math.abs(frame.predictedVoteA - .75) <= .01 },
      { id: 'reversal', ...t.missions.reversal, completed: referencePercentA >= 80 && votesA < VOTES / 2 && frame.probabilityA <= .45 },
    ]}
  />
}
