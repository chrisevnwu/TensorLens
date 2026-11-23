import { useMemo } from 'react'
import { SegmentedControl, SelectControl, SliderControl, ToggleControl } from '../../components/controls'
import { ExperimentShell } from '../../components/layout/ExperimentShell'
import { booleanField, choiceField, makeUrlCodec, numberField, useLabUrlState, type UrlStateCodec } from '../../components/utils/useLabUrlState'
import { FormulaBar } from '../../components/viz/FormulaBar'
import { simulateRoPE, type RopeConfig, type ScalingMode } from '../../engine/labs/embeddings-rope/engine'
import { ROPE_PRESETS, type RopePresetId } from '../../engine/labs/embeddings-rope/presets'
import { useI18n } from '../../i18n'
import { ropeCopy } from '../../i18n/labs/embeddings-rope'
import { RopeInspector, RopeStage } from './RopeStage'

interface State extends RopeConfig { preset: RopePresetId; step: number }
const modes: ScalingMode[] = ['none', 'pi', 'ntk']
const bases = [100, 1000, 10000, 500000]
const dimensions = [8, 12, 16]

function presetState(id: RopePresetId): State {
  const { id: preset, ...config } = ROPE_PRESETS.find(item => item.id === id) ?? ROPE_PRESETS[0]
  return { ...config, preset, step: 0 }
}

const initial = presetState('standard')
const fields = makeUrlCodec<State>({
  m: numberField(0, 64, 1), n: numberField(0, 64, 1), offset: numberField(0, 32, 1),
  ropeBase: choiceField(bases), dim: choiceField(dimensions),
  scalingMode: choiceField(modes), scaleFactor: numberField(1, 8, 1),
  compareSinusoidal: booleanField, preset: choiceField(ROPE_PRESETS.map(p => p.id)), step: numberField(0, 7, 1),
})
const codec: UrlStateCodec<State> = {
  encode: fields.encode,
  decode(params) {
    const preset = ROPE_PRESETS.find(p => p.id === params.get('preset')) ?? ROPE_PRESETS[0]
    const s = fields.decode(params, presetState(preset.id))
    return { ...s, step: Math.min(s.dim / 2 - 1, s.step) }
  },
}

export default function RopeLab() {
  const { locale } = useI18n()
  const t = ropeCopy[locale]
  const { state, setState, getShareUrl } = useLabUrlState(initial, codec)
  const result = useMemo(() => simulateRoPE(state), [state])
  const plane = result.planes[state.step]!

  function update(changes: Partial<State>) {
    setState(s => {
      const next = { ...s, ...changes }
      return { ...next, step: Math.min(next.step, next.dim / 2 - 1) }
    })
  }

  function chooseDistance(distance: number) {
    const delta = (state.m < state.n ? -1 : 1) * distance
    // Move the anchor only when keeping it fixed would push the query beyond the slider.
    const n = Math.min(64 - Math.max(0, delta), Math.max(-Math.min(0, delta), state.n))
    update({ n, m: n + delta })
  }

  return <ExperimentShell labId="embeddings-rope" step={state.step} maxStep={state.dim / 2 - 1}
    intervalMs={700} onStepChange={step => update({ step })} getShareUrl={getShareUrl}
    onReset={() => setState(presetState(state.preset))}
    presets={ROPE_PRESETS.map(({ id }) => ({
      id, label: t.presets[id], active: state.preset === id, onSelect: () => setState(presetState(id)),
    }))}
    controls={<>
      <SliderControl label={t.m} min={0} max={64} value={state.m} onChange={m => update({ m })} />
      <SliderControl label={t.n} min={0} max={64} value={state.n} onChange={n => update({ n })} />
      <SliderControl label={t.offset} min={0} max={32} value={state.offset} onChange={offset => update({ offset })} />
      <SelectControl label={t.ropeBase} value={state.ropeBase} options={bases.map(value => ({ value, label: value.toLocaleString(locale) }))}
        onChange={ropeBase => update({ ropeBase })} />
      <SegmentedControl label={t.dim} value={state.dim} options={dimensions.map(value => ({ value, label: String(value) }))}
        onChange={dim => update({ dim })} />
      <SegmentedControl label={t.mode} value={state.scalingMode} options={modes.map(value => ({ value, label: t.modes[value] }))}
        onChange={scalingMode => update({ scalingMode })} />
      <SliderControl label={t.scaleFactor} min={1} max={8} value={state.scaleFactor} onChange={scaleFactor => update({ scaleFactor })} />
      <ToggleControl label={t.compare} checked={state.compareSinusoidal} onChange={compareSinusoidal => update({ compareSinusoidal })} />
    </>}
    challenges={[
      { id: 'relative', ...t.missions.relative, completed: state.offset >= 5 && Math.abs(result.dot - result.unshiftedDot) < 1e-10 },
      { id: 'norm', ...t.missions.norm, completed: state.m >= 20 && Math.abs(result.normRatio - 1) < 1e-10 },
      { id: 'context', ...t.missions.context, completed: state.scalingMode === 'ntk' && state.scaleFactor >= 4 && result.effectiveBase > state.ropeBase },
    ]}
    formula={<FormulaBar tex={String.raw`\Delta\phi_{${plane.index}}=(m-n)\,\omega_{${plane.index}}=${result.relativeOffset}\cdot${plane.frequency.toPrecision(3)}\approx${plane.relativeAngle.toFixed(3)}\,\mathrm{rad}`} />}
    stage={<RopeStage result={result} compareSinusoidal={state.compareSinusoidal} scalingMode={state.scalingMode}
      plane={state.step} onSelectPlane={step => update({ step })} onDistanceChange={chooseDistance} />}
    metrics={[
      { label: t.relative, value: String(result.relativeOffset) },
      { label: t.dot, value: result.dot.toFixed(6), tone: 'accent', hint: t.baseline + ' · ' + result.unshiftedDot.toFixed(6) },
      { label: t.norm, value: result.normRatio.toFixed(10), tone: 'good' },
      { label: t.fastest, value: result.fastestAngle.toFixed(3) + ' rad' },
    ]}
    inspector={<RopeInspector plane={plane} />}
    explainer={<><p>{t.guide}</p><p>{t.modesGuide}</p>{state.compareSinusoidal && <p>{t.additive}</p>}</>}
  />
}
