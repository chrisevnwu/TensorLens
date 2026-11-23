import { useMemo } from 'react'
import { SelectControl, SliderControl, ToggleControl } from '../../components/controls'
import { ExperimentShell } from '../../components/layout/ExperimentShell'
import { useLabUrlState } from '../../components/utils/useLabUrlState'
import { FormulaBar } from '../../components/viz/FormulaBar'
import { arrangements, runExperiment } from '../../engine/labs/image-text-contrastive/engine'
import { useI18n } from '../../i18n'
import { contrastiveCopy } from '../../i18n/labs/image-text-contrastive'
import { BatchStage } from './BatchStage'
import { codec, initial, presetState } from './config'

export default function ContrastiveLab() {
  const { locale } = useI18n()
  const t = contrastiveCopy[locale]
  const { state, setState, getShareUrl } = useLabUrlState(initial, codec)
  const { temperature, order, broad, step, column } = state
  const batch = useMemo(() => runExperiment(order, temperature, broad), [order, temperature, broad])
  const reference = useMemo(() => runExperiment('matched', temperature, broad), [temperature, broad])
  const difference = batch.loss - reference.loss
  const select = (row: number, col: number) => setState(current => ({ ...current, step: row, column: col }))
  const isDiagonal = step === column
  return <ExperimentShell labId="image-text-contrastive" step={step} maxStep={2} intervalMs={900}
    onStepChange={next => select(next, next)} onReset={() => setState(presetState(state.preset))} getShareUrl={getShareUrl}
    presets={arrangements.map(id => ({ id, label: t.presets[id], active: state.preset === id, onSelect: () => setState(presetState(id)) }))}
    controls={<>
      <SelectControl label={t.order} value={order} options={arrangements.map(value => ({ value, label: t.presets[value] }))}
        onChange={value => setState(s => ({ ...s, order: value, step: 0, column: 0 }))} />
      <SliderControl label={t.temperature} min={.05} max={1} step={.05} value={temperature} format={v => v.toFixed(2)}
        onChange={value => setState(s => ({ ...s, temperature: value }))} />
      <ToggleControl label={t.broad} checked={broad} onChange={value => setState(s => ({ ...s, broad: value }))} />
    </>}
    formula={<FormulaBar tex={String.raw`z_{ij}=\cos(u_i,v_j)/\tau,\quad L=(L_{I\to T}+L_{T\to I})/2`} />}
    stage={<BatchStage state={state} batch={batch} onSelect={select} onView={view => setState(s => ({ ...s, view }))} />}
    metrics={[
      { label: t.symLoss, value: batch.loss.toFixed(4), hint: t.lossHint, tone: 'accent' },
      { label: t.imageLoss, value: batch.imageLoss.toFixed(4) }, { label: t.textLoss, value: batch.captionLoss.toFixed(4) },
      { label: t.imageHits, value: batch.imageHits + ' / 3', hint: t.hitHint }, { label: t.textHits, value: batch.captionHits + ' / 3', hint: t.hitHint },
    ]}
    inspector={<div className="contrastive-baseline"><dl>
      <div><dt>{t.reference}</dt><dd>{reference.loss.toFixed(4)}</dd></div>
      <div><dt>{t.lossDifference}</dt><dd>{Math.abs(difference) < 1e-12 ? '0.0000' : difference.toFixed(4)}</dd></div>
    </dl><p>{t.compareHelp}</p></div>}
    explainer={<><p>{t.guide}</p><p>{t.objective}</p><p>{t.labels}</p></>}
    challenges={[
      { id: 'sharp', ...t.missions.sharp, completed: order === 'matched' && !broad && temperature <= .2 && step === 2 && isDiagonal && batch.byImage[step]![column]! > .9 },
      { id: 'swap', ...t.missions.swap, completed: order === 'swapped' && !broad && step === 0 && column === 1 && batch.cosines[step]![column]! > batch.cosines[step]![step]! && difference > 0 },
      { id: 'joint', ...t.missions.joint, completed: order === 'reordered' && !broad && step === 2 && isDiagonal && Math.abs(difference) < 1e-12 },
    ]}
  />
}
