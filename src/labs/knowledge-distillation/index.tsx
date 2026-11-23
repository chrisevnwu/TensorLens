import { useMemo } from 'react'
import { SliderControl } from '../../components/controls'
import { ExperimentShell } from '../../components/layout/ExperimentShell'
import { useLabUrlState } from '../../components/utils/useLabUrlState'
import { FormulaBar } from '../../components/viz/FormulaBar'
import { trainDistillation, LEARNING_RATE, UPDATES, type DistillConfig } from '../../engine/labs/knowledge-distillation/engine'
import { useI18n } from '../../i18n'
import { distillCopy } from '../../i18n/labs/knowledge-distillation'
import { classes, codec, initial, presetIds, presetState } from './config'
import { DistillStage } from './DistillStage'

export default function KnowledgeDistillationLab() {
  const { locale } = useI18n()
  const t = distillCopy[locale]
  const { state, setState, getShareUrl } = useLabUrlState(initial, codec)
  const { alpha, temperature, tail, step, focus, preset } = state
  const trace = useMemo(() => trainDistillation({ alpha, temperature, tail }), [alpha, temperature, tail])
  const frame = trace[step]!, student = frame.student
  const i = classes.indexOf(focus), gap = frame.runnerUpGap
  const go = (next: number) => setState(s => ({ ...s, step: next }))
  const configure = (changes: Partial<DistillConfig>) => setState(s => ({ ...s, ...changes, step: 0 }))
  return <ExperimentShell labId="knowledge-distillation" step={step} maxStep={UPDATES} onStepChange={go}
    intervalMs={230} getShareUrl={getShareUrl} onReset={() => setState(presetState(preset))}
    presets={presetIds.map(id => ({ id, label: t.presets[id], active: preset === id, onSelect: () => setState(presetState(id)) }))}
    controls={<>
      <SliderControl label={t.alpha} value={alpha} min={0} max={1} step={.05} format={v => v.toFixed(2)} onChange={value => configure({ alpha: value })} />
      <SliderControl label={t.temperature} value={temperature} min={1} max={8} step={.5} onChange={value => configure({ temperature: value })} />
      <SliderControl label={t.tail} value={tail} min={-2} max={2} step={.25} onChange={value => configure({ tail: value })} />
    </>}
    formula={<FormulaBar tex={String.raw`L=(1-\alpha)(-\log p_{1,y})+\alpha T^2 D_{\rm KL}(q_T\Vert p_T)`} />}
    stage={<DistillStage state={state} trace={trace} go={go} setFocus={value => setState(s => ({ ...s, focus: value }))}
      setView={value => setState(s => ({ ...s, view: value }))} />}
    metrics={[
      { label: t.loss, value: student.loss.toFixed(4), tone: 'accent' },
      { label: t.hard, value: student.hardLoss.toFixed(4) },
      { label: t.kl, value: student.softKL.toFixed(4), hint: t.klHint },
      { label: t.gap, value: (100 * gap).toFixed(1) + ' ' + t.pp, hint: t.gapHint },
    ]}
    inspector={<section className="distill-inspector"><h3>{t.inspection.replace('{class}', t.classes[focus])}</h3>
      <dl>{([[t.logit, frame.logits[i]!], [t.gradient, student.gradient[i]!], [t.change, -LEARNING_RATE * student.gradient[i]!]] as const)
        .map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value.toFixed(4)}</dd></div>)}</dl></section>}
    explainer={<><p>{t.learn}</p><p>{t.tempGuide}</p><p>{t.scope}</p></>}
    challenges={[
      { id: 'hard', ...t.missions.hard, completed: alpha === 0 && student.probability[0]! >= .9 && gap === 0 },
      { id: 'soft', ...t.missions.soft, completed: alpha === 1 && temperature === 2 && tail === 2 && gap >= .2 },
      { id: 'swap', ...t.missions.swap, completed: alpha === 1 && temperature === 4 && tail === -2 && gap <= -.2 && student.probability[0]! > student.probability[2]! },
    ]}
  />
}
