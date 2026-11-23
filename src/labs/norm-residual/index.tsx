import { useMemo } from 'react'
import { SegmentedControl, SliderControl, ToggleControl } from '../../components/controls'
import { ExperimentShell } from '../../components/layout/ExperimentShell'
import { booleanField, choiceField, makeUrlCodec, numberField, useLabUrlState, type UrlStateCodec } from '../../components/utils/useLabUrlState'
import { FormulaBar } from '../../components/viz/FormulaBar'
import type { Activation } from '../../engine/labs/norm-residual/branch'
import { simulateResidual, type Placement, type ResidualConfig } from '../../engine/labs/norm-residual/engine'
import type { NormType } from '../../engine/labs/norm-residual/normalization'
import { NORM_PRESETS, type NormPresetId } from '../../engine/labs/norm-residual/presets'
import { useI18n } from '../../i18n'
import { normalCopy } from '../../i18n/labs/norm-residual'
import { NormInspector, NormStage } from './NormStage'

interface State extends ResidualConfig {
  preset: NormPresetId
  step: number
  logScale: boolean
  seenLayerNorm: boolean
  seenRmsNorm: boolean
}

const placements: Placement[] = ['pre-norm','post-norm','none']
const norms: NormType[] = ['rmsnorm','layernorm']
const activations: Activation[] = ['swiglu','gelu','relu']
const activationLabels = { swiglu: 'SwiGLU', gelu: 'GELU', relu: 'ReLU' }

function observe(state: State) {
  const spiked = state.outlierMag >= 10
  return { ...state, step: Math.min(state.numLayers,state.step),
    seenLayerNorm: spiked && (state.seenLayerNorm || state.normType === 'layernorm'),
    seenRmsNorm: spiked && (state.seenRmsNorm || state.normType === 'rmsnorm'),
  }
}

function presetState(id: NormPresetId): State {
  const {id:preset, ...config} = NORM_PRESETS.find(p => p.id === id) ?? NORM_PRESETS[0]
  return observe({ ...config, preset, step: 0, logScale: false, seenLayerNorm:false, seenRmsNorm:false })
}

const fields = makeUrlCodec<State>({
  preset: choiceField(NORM_PRESETS.map(p => p.id)), numLayers: numberField(4,32,1), placement:choiceField(placements),
  normType: choiceField(norms), useResidual:booleanField, activation:choiceField(activations), weightGain:numberField(.5,1.8,.1),
  outlierMag:numberField(0,20,1), step:numberField(0,32,1), logScale:booleanField, seenLayerNorm:booleanField, seenRmsNorm:booleanField,
})
const initial = presetState('modern')
const codec: UrlStateCodec<State> = {
  encode: fields.encode,
  decode(params) {
    const preset = NORM_PRESETS.find(p => p.id === params.get('preset')) ?? NORM_PRESETS[0]
    return observe(fields.decode(params,presetState(preset.id)))
  },
}

function numeric(x: number) {
  const magnitude = Math.abs(x)
  return magnitude >= 10000 || (magnitude > 0 && magnitude < .001) ? x.toExponential(3) : x.toFixed(3)
}

export default function ResidualLab() {
  const { locale } = useI18n()
  const t = normalCopy[locale]
  const { state, setState, getShareUrl } = useLabUrlState(initial,codec)
  const { numLayers, placement, normType, useResidual, activation, weightGain, outlierMag } = state
  const result = useMemo(() => simulateResidual({numLayers,placement,normType,useResidual,activation,weightGain,outlierMag}),
    [numLayers,placement,normType,useResidual,activation,weightGain,outlierMag])
  const norm = normType === 'rmsnorm' ? '\\operatorname{RMSNorm}' : '\\operatorname{LayerNorm}'
  const input = placement === 'pre-norm' ? norm + '(x_l)' : 'x_l'
  const mixed = (useResidual ? 'x_l+' : '') + 'F_l(' + input + ')'
  const formula = 'x_{l+1}=' + (placement === 'post-norm' ? norm + '\\left(' + mixed + '\\right)' : mixed)
  const limited = result.trace.some(frame => frame.saturated)

  function update(changes: Partial<State>) {
    setState(s => observe({ ...s, ...changes }))
  }

  return <ExperimentShell labId="norm-residual" step={state.step} maxStep={numLayers} onStepChange={step => update({ step })}
    intervalMs={400} getShareUrl={getShareUrl} onReset={() => setState(presetState(state.preset))}
    presets={NORM_PRESETS.map(({id}) => ({ id, label:t.presets[id], active:state.preset===id, onSelect:() => setState(presetState(id)) }))}
    controls={<>
      <SliderControl label={t.numLayers} value={numLayers} min={4} max={32} onChange={value => update({numLayers:value})} />
      <SegmentedControl label={t.placement} options={placements.map(value => ({value,label:t.placements[value]}))}
        value={placement} onChange={value => update({placement:value})} />
      <SegmentedControl label={t.normType} options={norms.map(value => ({value,label:t.norms[value]}))}
        value={normType} onChange={value => update({normType:value})} />
      <ToggleControl label={t.useResidual} checked={useResidual} onChange={value => update({useResidual:value})} />
      <SegmentedControl label={t.activation} options={activations.map(value => ({value,label:activationLabels[value]}))}
        value={activation} onChange={value => update({activation:value})} />
      <SliderControl label={t.weightGain} value={weightGain} min={.5} max={1.8} step={.1} format={v=>v.toFixed(1)} onChange={value=>update({weightGain:value})} />
      <SliderControl label={t.outlierMag} value={outlierMag} min={0} max={20} onChange={value=>update({outlierMag:value})} />
    </>}
    formula={<FormulaBar tex={formula} />}
    challenges={[
      {id:'divergence', ...t.missions.divergence, completed:placement==='none' && !useResidual && numLayers>=16 && (result.normRatio>10 || result.normRatio<.05)},
      {id:'rescue', ...t.missions.rescue, completed:placement==='pre-norm' && useResidual && numLayers>=24 && result.gradRatio>=.2 && result.gradRatio<=5},
      {id:'outlier', ...t.missions.outlier, completed:outlierMag>=10 && state.seenLayerNorm && state.seenRmsNorm},
    ]}
    stage={<>{limited && <p role="status">{t.limited}</p>}<NormStage result={result} layer={state.step} onLayerChange={step=>update({step})}
      logScale={state.logScale} onLogScaleChange={logScale=>update({logScale})} /></>}
    metrics={[
      {label:t.finalNorm,value:numeric(result.finalNorm),tone:limited?'warn':'accent'},
      {label:t.gradRatio,value:numeric(result.gradRatio),hint:t.gradHint},
      {label:t.cosine,value:numeric(result.signalCosine)},
      {label:t.saved,value:String(result.flopsSaved),hint:t.savedHint.replace('{rms}',String(result.rmsNormFlops)).replace('{ln}',String(result.layerNormFlops))},
    ]}
    inspector={<NormInspector result={result} layer={state.step} normType={normType} />}
    explainer={<><p>{t.guide}</p><p>{t.symmetry}</p><p>{t.comparison}</p></>}
  />
}
