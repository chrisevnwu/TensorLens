import { useMemo } from 'react'
import { SegmentedControl, SliderControl, ToggleControl } from '../../components/controls'
import { ExperimentShell } from '../../components/layout/ExperimentShell'
import { booleanField, choiceField, makeUrlCodec, numberField, stringField, useLabUrlState, type UrlStateCodec } from '../../components/utils/useLabUrlState'
import { FormulaBar } from '../../components/viz/FormulaBar'
import { parseTokens, simulateAttention, type AttentionConfig, type MaskType } from '../../engine/labs/attention-debugger/engine'
import { ATTENTION_PRESETS, type AttentionPresetId } from '../../engine/labs/attention-debugger/presets'
import type { AttentionTopology } from '../../engine/labs/attention-debugger/topology'
import { useI18n } from '../../i18n'
import { attentionCopy } from '../../i18n/labs/attention-debugger'
import { AttentionStage, AttentionInspector } from './AttentionStage'
import './inputs.css'

interface State extends Omit<AttentionConfig, 'tokens'> {
  preset: AttentionPresetId
  tokens: string
  selectedHead: number
  row: number
  col: number
  step: number
  sawBidirectional: boolean
}

const masks: MaskType[] = ['causal', 'bidirectional', 'sliding']
const topologies: AttentionTopology[] = ['MHA','GQA','MQA']
const counts = [1,2,4]
const maxText = 384

function presetState(id: AttentionPresetId): State {
  const { id: preset, tokens, ...config } = ATTENTION_PRESETS.find(p => p.id === id) ?? ATTENTION_PRESETS[0]
  return { ...config, preset, tokens: tokens.join(' '), selectedHead: 0, row: 0, col: 0, step: 0, sawBidirectional: config.maskType === 'bidirectional' }
}

function normalize(s: State) {
  const last = Math.max(0, parseTokens(s.tokens).length - 1)
  return { ...s, selectedHead: Math.min(s.selectedHead, s.numHeads-1), row: Math.min(last,s.row), col: Math.min(last,s.col),
    sawBidirectional: s.sawBidirectional || (s.maskType === 'bidirectional' && last > 0) }
}

const initial = presetState('causal')
const fields = makeUrlCodec<State>({
  preset: choiceField(ATTENTION_PRESETS.map(p => p.id)), tokens: stringField(maxText),
  numHeads: choiceField(counts), selectedHead: numberField(0,3,1), useScaling: booleanField, logitScale: numberField(.5,4,.1),
  maskType: choiceField(masks), windowSize: numberField(2,5,1), topology: choiceField(topologies),
  row: numberField(0,7,1), col: numberField(0,7,1), step: numberField(0,5,1), sawBidirectional: booleanField,
})
const codec: UrlStateCodec<State> = {
  encode: fields.encode,
  decode(params) {
    const preset = ATTENTION_PRESETS.find(p => p.id === params.get('preset')) ?? ATTENTION_PRESETS[0]
    return normalize(fields.decode(params, presetState(preset.id)))
  },
}

export default function AttentionLab() {
  const { locale } = useI18n()
  const t = attentionCopy[locale]
  const { state, setState, getShareUrl } = useLabUrlState(initial, codec)
  const { tokens: text, numHeads, useScaling, logitScale, maskType, windowSize, topology } = state
  const tokens = useMemo(() => parseTokens(text), [text])
  const result = useMemo(() => simulateAttention({ tokens, numHeads, useScaling, logitScale, maskType, windowSize, topology }),
    [tokens, numHeads, useScaling, logitScale, maskType, windowSize, topology])
  const head = result.heads[state.selectedHead]!
  const cell = { row: state.row, col: state.col }
  const futureBlocked = maskType === 'causal' && tokens.length > 1 && tokens.every((_, i) =>
    tokens.every((_, j) => j <= i || head.weights.get(i,j) === 0))

  function update(changes: Partial<State>) {
    setState(old => normalize({ ...old, ...changes }))
  }

  const equations = [
    String.raw`X\in\mathbb{R}^{${tokens.length}\times12}`,
    String.raw`Q=XW_Q,\quad K=XW_K,\quad V=XW_V`,
    String.raw`S=${logitScale.toFixed(1)}^2QK^\top`,
    String.raw`S'=${useScaling ? 'S/\\sqrt{' + result.topology.headDim + '}' : 'S'}+M`,
    String.raw`A_{ij}=\frac{\exp(S'_{ij})}{\sum_{k}\exp(S'_{ik})}`,
    String.raw`O=\operatorname{Concat}(A_hV_h)_{h=1}^{${numHeads}}W_O`,
  ]

  return <ExperimentShell labId="attention-debugger" step={state.step} maxStep={5} onStepChange={step => update({ step })}
    onReset={() => setState(presetState(state.preset))} getShareUrl={getShareUrl}
    presets={ATTENTION_PRESETS.map(({id}) => ({ id, label: t.presets[id], active: state.preset === id,
      onSelect: () => setState(s => normalize({ ...presetState(id), sawBidirectional: s.sawBidirectional })),
    }))}
    controls={<>
      <label className="wb-control attention-input">{t.tokens}
        <textarea name="tokens" rows={2} maxLength={maxText} value={text} onChange={event => update({ tokens: event.target.value })} />
        <small>{t.tokenHint}</small>
      </label>
      <div className="attention-input-chips">{tokens.map((token,index) => <input key={index} value={token}
        aria-label={t.token + ' ' + (index+1)} size={Math.min(15,Math.max(2,[...token].length))} maxLength={64}
        onChange={event => update({ tokens: tokens.map((value,i) => i === index ? event.target.value : value).join(' ') })} />)}</div>
      <SegmentedControl label={t.numHeads} value={numHeads} options={counts.map(value => ({ value, label: String(value) }))} onChange={value => update({numHeads:value})} />
      <SegmentedControl label={t.selectedHead} value={state.selectedHead} options={result.heads.map((_,i) => ({value:i, label:'H' + i}))}
        onChange={selectedHead => update({selectedHead})} />
      <ToggleControl label={t.scale} checked={useScaling} onChange={value => update({useScaling:value})} />
      <SliderControl label={t.logitScale} value={logitScale} min={.5} max={4} step={.1} format={v => v.toFixed(1)} onChange={value => update({logitScale:value})} />
      <SegmentedControl label={t.mask} value={maskType} options={masks.map(value => ({value,label:t.maskTypes[value]}))} onChange={value => update({maskType:value})} />
      {maskType === 'sliding' && <SliderControl label={t.windowSize} value={windowSize} min={2} max={5} onChange={value => update({windowSize:value})} />}
      <SegmentedControl label={t.topology} value={topology} options={topologies.map(value => ({value,label:value}))} onChange={value => update({topology:value})} />
    </>}
    challenges={[
      { id:'saturation', ...t.missions.saturation, completed:tokens.length > 1 && !useScaling && logitScale >= 2.5 && head.meanEntropy < .35 },
      { id:'leakage', ...t.missions.leakage, completed:state.sawBidirectional && futureBlocked },
      { id:'sharing', ...t.missions.sharing, completed:numHeads === 4 && topology === 'GQA' && result.topology.sharingRatio === 2 },
    ]}
    formula={<><h2 className="attention-step-title">{state.step + 1} · {t.stages[state.step]}</h2><FormulaBar tex={equations[state.step]!} /></>}
    stage={tokens.length ? <AttentionStage result={result} headIndex={state.selectedHead} step={state.step} cell={cell}
      onSelectCell={value => update(value)} onSelectHead={selectedHead => update({selectedHead})} /> : <p role="status">{t.empty}</p>}
    metrics={[
      {label:t.entropy,value:head.meanEntropy.toFixed(3) + ' ' + t.nats,tone:'accent'},
      {label:t.peak,value:head.peak.toFixed(4)}, {label:t.sharing,value:result.topology.sharingRatio + '×'},
      {label:t.density,value:(100*head.maskDensity).toFixed(1) + '%',hint:t.allowed},
    ]}
    inspector={tokens.length ? <AttentionInspector result={result} headIndex={state.selectedHead} cell={cell} /> : <p>{t.empty}</p>}
    explainer={<p>{t.guides[state.step]}</p>}
  />
}
