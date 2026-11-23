import { SliderControl, ToggleControl } from '../../components/controls'
import { ExperimentShell } from '../../components/layout/ExperimentShell'
import { useLabUrlState } from '../../components/utils/useLabUrlState'
import { FormulaBar } from '../../components/viz/FormulaBar'
import { ALL_POSITIONS, evaluateSequence, NOTES, POSITIONS } from '../../engine/labs/language-model-loss/engine'
import { useI18n } from '../../i18n'
import { lossCopy } from '../../i18n/labs/language-model-loss'
import { codec, initial, presetIds, presetState } from './config'
import { decimal, LossStage, percent } from './LossStage'
import './loss.css'

export default function LanguageModelLoss() {
  const { locale } = useI18n()
  const t = lossCopy[locale]
  const {state, setState, getShareUrl} = useLabUrlState(initial, codec)
  const { gap, mask, step } = state
  const run = evaluateSequence(gap, mask)
  const reference = evaluateSequence(Math.log(3), mask)
  const row = run.rows[step]!
  const last = POSITIONS - 1
  function selectStep(index: number) { setState(old => ({...old, step: index})) }
  return <ExperimentShell labId="language-model-loss" step={step} maxStep={last} onStepChange={selectStep}
    onReset={() => setState(presetState(state.preset))} getShareUrl={getShareUrl}
    presets={presetIds.map(id => ({id, label: t.presets[id], active: state.preset === id, onSelect: () => setState(presetState(id))}))}
    controls={<>
      <SliderControl label={t.gap} value={gap} min={0} max={8} step={.1} format={value => value.toFixed(1)}
        onChange={value => setState(old => ({...old, gap: value}))}/>
      <ToggleControl label={t.include} checked={row.included}
        onChange={included => setState(old => ({...old, mask: included ? old.mask | (1 << old.step) : old.mask & ~(1 << old.step)}))}/>
    </>}
    formula={<FormulaBar tex={String.raw`\ell_i=-\ln p(y_i),\qquad H=\frac{1}{|S|}\sum_{i\in S}\ell_i,\qquad \mathrm{PPL}=e^H`}/>}
    stage={<LossStage run={run} reference={reference} step={step} onSelect={selectStep}/>}
    metrics={[{label: t.meanLoss, value: decimal(run.meanLoss)}, {label: t.perplexity, value: decimal(run.perplexity), tone: 'accent'},
      {label: t.accuracy, value: run.accuracy === null ? '—' : percent(run.accuracy)}, {label: t.tokens, value: run.count + ' / ' + POSITIONS}]}
    inspector={<dl className="loss-detail">
      <dt>{t.position}</dt><dd>{step + 1} · {row.included ? t.scored : t.excluded}</dd>
      <dt>{t.observed}</dt><dd>{NOTES[row.previous]} → {NOTES[row.target]}</dd>
      <dt>{t.likelihood}</dt><dd>{percent(row.probabilities[row.target]!)}</dd>
      <dt>{t.loss}</dt><dd>{decimal(row.loss)} {t.axis}</dd>
      <dt>{t.totalLoss}</dt><dd>{decimal(run.totalLoss)}</dd>
    </dl>}
    explainer={<><p>{t.ruleText}</p><p>{t.guide}</p>{gap === 0 && <p>{t.ties}</p>}</>}
    challenges={[
      {id: 'uniform', ...t.missions.uniform, completed: step === last && gap === 0 && mask === ALL_POSITIONS && Math.abs(run.perplexity! - 4) < 1e-10},
      {id: 'error', ...t.missions.error, completed: step === last && gap === 8 && mask === ALL_POSITIONS && run.correct === reference.correct && run.meanLoss! > reference.meanLoss!},
      {id: 'mask', ...t.missions.mask, completed: step === last && gap === 8 && mask === ALL_POSITIONS - (1 << last) && run.perplexity! < 1.01},
    ]}/>
}
