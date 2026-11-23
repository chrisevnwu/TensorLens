import { useMemo } from 'react'
import { SliderControl } from '../../components/controls'
import { ExperimentShell } from '../../components/layout/ExperimentShell'
import { useLabUrlState } from '../../components/utils/useLabUrlState'
import { FormulaBar } from '../../components/viz/FormulaBar'
import { distributions, OUTPUT_LENGTH, runSpeculation, TOKENS, type SpecConfig } from '../../engine/labs/speculative-decoding/engine'
import { useI18n } from '../../i18n'
import { speculativeCopy } from '../../i18n/labs/speculative-decoding'
import { codec, initial, presetIds, presetState } from './config'
import { SpecStage } from './SpecStage'

export default function SpeculativeLab() {
  const { locale } = useI18n()
  const t = speculativeCopy[locale]
  const { state, setState, getShareUrl } = useLabUrlState(initial, codec)
  const { mismatch, blockSize, seed, step, slot } = state
  const blocks = useMemo(() => runSpeculation({ mismatch, blockSize, seed }), [mismatch, blockSize, seed])
  const frame = blocks[step]!
  const end = frame.output.length === OUTPUT_LENGTH
  const missing = distributions(frame.tailContext, mismatch).draft[TOKENS.indexOf(frame.tailToken)] === 0
  function configure(changes: Partial<SpecConfig>) {
    setState(s => ({ ...s, ...changes, step: 0, slot: 0 }))
  }
  return <ExperimentShell labId="speculative-decoding" step={step} maxStep={blocks.length - 1}
    onStepChange={next => setState(s => ({ ...s, step: next, slot: 0 }))}
    intervalMs={850} getShareUrl={getShareUrl} onReset={() => setState(presetState(state.preset))}
    presets={presetIds.map(id => ({ id, label: t.presets[id], active: state.preset === id, onSelect: () => setState(presetState(id)) }))}
    controls={<>
      <SliderControl label={t.mismatch} min={0} max={100} step={5} value={mismatch} format={v => v + '%'} onChange={v => configure({ mismatch: v })} />
      <SliderControl label={t.blockSize} min={1} max={4} value={blockSize} onChange={v => configure({ blockSize: v })} />
      <SliderControl label={t.seed} min={1} max={100} value={seed} onChange={v => configure({ seed: v })} />
    </>}
    formula={<FormulaBar tex={String.raw`\alpha(x)=\min\!\left(1,\frac{p(x)}{q(x)}\right),\quad r(x)\propto [p(x)-q(x)]_+`}/>}
    stage={<SpecStage state={state} block={frame} start={blocks[step - 1]?.output.length ?? 0}
      select={next => setState(s => ({ ...s, slot: next }))} />}
    metrics={[
      { label: t.calls, value: String(step + 1), tone: 'accent' },
      { label: t.baseline, value: String(frame.output.length), hint: t.baselineHint },
      { label: t.acceptance, value: frame.accepted + ' / ' + frame.tested },
      { label: t.wasted, value: String(frame.discarded), hint: t.wastedHint },
    ]}
    explainer={<><p>{t.guide}</p><p>{t.blockGuide}</p><p>{t.lawGuide}</p></>}
    challenges={[
      { id: 'budget', ...t.missions.budget, completed: end && mismatch === 0 && blockSize === 3 && step + 1 === 4 },
      { id: 'support', ...t.missions.support, completed: mismatch === 100 && frame.tailKind === 'correction' && slot === frame.proposals.length && missing },
      { id: 'mixed', ...t.missions.mixed, completed: end && mismatch === 50 && frame.discarded > 0 && step + 1 <= 10 },
    ]}
  />
}
