import { useEffect, useMemo, useState } from 'react'
import { SliderControl, ToggleControl } from '../../components/controls'
import { ExperimentShell } from '../../components/layout/ExperimentShell'
import { booleanField, choiceField, makeUrlCodec, numberField, stringField, useLabUrlState, type UrlStateCodec } from '../../components/utils/useLabUrlState'
import { FormulaBar } from '../../components/viz/FormulaBar'
import { encode, metrics, tokenTree, trainBPE } from '../../engine/labs/bpe-tokenizer/engine'
import { BPE_PRESETS, type BpePresetId } from '../../engine/labs/bpe-tokenizer/presets'
import { useI18n } from '../../i18n'
import { bpeCopy } from '../../i18n/labs/bpe-tokenizer'
import { BpeInspector, BpeStage } from './BpeStage'

interface BpeState {
  preset: BpePresetId
  corpus: string
  prompt: string
  numMerges: number
  preTokenize: boolean
  showByteHex: boolean
  step: number
  selectedIndex: number
}

const maxCorpus = 4096
const maxPrompt = 1024

function presetState(id: BpePresetId): BpeState {
  const { id: preset, ...values } = BPE_PRESETS.find(item => item.id === id) ?? BPE_PRESETS[0]
  return { preset, ...values, step: values.numMerges, selectedIndex: -1 }
}

const initial = presetState('multilingual')
const fields = makeUrlCodec<BpeState>({
  preset: choiceField(BPE_PRESETS.map(item => item.id)),
  corpus: stringField(maxCorpus), prompt: stringField(maxPrompt), numMerges: numberField(0, 50, 1),
  preTokenize: booleanField, showByteHex: booleanField, step: numberField(0, 50, 1),
  selectedIndex: numberField(-1, maxPrompt * 4, 1),
})
const codec: UrlStateCodec<BpeState> = {
  encode: fields.encode,
  decode(params) {
    const preset = BPE_PRESETS.find(item => item.id === params.get('preset')) ?? BPE_PRESETS[0]
    return fields.decode(params, presetState(preset.id))
  },
}

export default function BpeTokenizerLab() {
  const { locale } = useI18n()
  const t = bpeCopy[locale]
  const { state, setState, getShareUrl } = useLabUrlState(initial, codec)
  const [preview, setPreview] = useState<number | null>(null)
  const model = useMemo(() => trainBPE(state.corpus, state.numMerges, state.preTokenize),
    [state.corpus, state.numMerges, state.preTokenize])
  const step = Math.min(state.step, model.rules.length)
  const ids = useMemo(() => encode(state.prompt, model, step), [state.prompt, model, step])
  const selected = state.selectedIndex < ids.length ? state.selectedIndex : -1
  const highlighted = preview !== null && preview < ids.length ? preview : selected
  const tree = useMemo(() => highlighted >= 0 ? tokenTree(ids[highlighted]!, model) : null, [highlighted, ids, model])
  const selectedDepth = useMemo(() => selected >= 0 ? tokenTree(ids[selected]!, model).depth : 0, [selected, ids, model])
  const data = useMemo(() => metrics(state.prompt, ids, step), [state.prompt, ids, step])
  const rule = model.rules[step - 1]
  const frame = model.timeline[step]!

  // Short corpora may exhaust all pairs before the requested step.
  useEffect(() => {
    if (state.step !== step || state.selectedIndex !== selected) {
      setState(previous => ({ ...previous, step, selectedIndex: selected }))
    }
  }, [state.step, state.selectedIndex, step, selected, setState])

  function update(changes: Partial<BpeState>) {
    setPreview(null)
    setState(previous => ({ ...previous, selectedIndex: -1, ...changes }))
  }

  function choosePreset(id: BpePresetId) {
    setPreview(null)
    setState(presetState(id))
  }

  const explain = rule ? t.merge
    .replace('{left}', String(rule.left)).replace('{right}', String(rule.right))
    .replace('{newId}', String(rule.newId)).replace('{count}', String(rule.count))
    .replace('{applied}', String(frame.occurrences.length)) : t.before

  return <ExperimentShell labId="bpe-tokenizer" step={step} maxStep={model.rules.length}
    onStepChange={value => update({ step: value })} getShareUrl={getShareUrl}
    onReset={() => choosePreset(state.preset)}
    presets={BPE_PRESETS.map(preset => ({
      id: preset.id, label: t.presets[preset.id], active: state.preset === preset.id, onSelect: () => choosePreset(preset.id),
    }))}
    controls={<>
      <label className="wb-control bpe-text-input">{t.corpus}<textarea name="corpus" rows={5} value={state.corpus} maxLength={maxCorpus}
        onChange={event => update({ corpus: event.target.value })} /></label>
      <label className="wb-control bpe-text-input">{t.prompt}<textarea name="prompt" rows={3} value={state.prompt} maxLength={maxPrompt}
        onChange={event => update({ prompt: event.target.value })} /></label>
      <SliderControl label={t.budget} value={state.numMerges} min={0} max={50}
        onChange={value => update({ numMerges: value, step: value })} />
      <ToggleControl label={t.preTokenize} checked={state.preTokenize} onChange={value => update({ preTokenize: value })} />
      <ToggleControl label={t.showByteHex} checked={state.showByteHex} onChange={value => setState(s => ({ ...s, showByteHex: value }))} />
    </>}
    challenges={[
      { id: 'bytes', ...t.missions.bytes, completed: step === 0 && data.charCount > 0 && data.utf8Bytes / data.charCount >= 2 },
      { id: 'compress', ...t.missions.compress, completed: data.bytesPerToken >= 2.2 },
      { id: 'inspect', ...t.missions.inspect, completed: selectedDepth >= 3 },
    ]}
    formula={<FormulaBar tex={rule ? String.raw`t_{${rule.left}}\;t_{${rule.right}}\;\longrightarrow\;t_{${rule.newId}}\qquad |V|=256+${step}` :
      String.raw`V_0=\{0,1,\ldots,255\},\qquad |V_0|=256`} />}
    stage={<BpeStage corpus={state.corpus} prompt={state.prompt} model={model} ids={ids} step={step}
      showByteHex={state.showByteHex} selectedIndex={selected} onPreview={setPreview}
      onSelect={index => { setPreview(null); setState(s => ({ ...s, selectedIndex: index })) }} />}
    metrics={[
      { label: t.tokenCount, value: String(data.tokenCount), tone: 'accent' },
      { label: t.utf8Bytes, value: String(data.utf8Bytes) },
      { label: t.charsPerToken, value: data.charsPerToken.toFixed(2) },
      { label: t.vocabSize, value: String(data.vocabSize) },
      { label: t.byteRatio, value: data.bytesPerToken.toFixed(2), tone: 'good' },
    ]}
    inspector={<BpeInspector tree={tree} />}
    explainer={<><p>{explain}</p><p>{t.deployment}</p></>}
  />
}
