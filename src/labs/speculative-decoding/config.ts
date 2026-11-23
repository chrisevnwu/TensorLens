import { choiceField, makeUrlCodec, numberField, type UrlStateCodec } from '../../components/utils/useLabUrlState'
import { OUTPUT_LENGTH, runSpeculation, type SpecConfig } from '../../engine/labs/speculative-decoding/engine'
import { SPEC_PRESETS, type SpecPreset } from '../../engine/labs/speculative-decoding/presets'

export const presetIds = Object.keys(SPEC_PRESETS) as SpecPreset[]
export interface State extends SpecConfig { preset: SpecPreset; step: number; slot: number }

export function presetState(preset: SpecPreset): State {
  return { ...SPEC_PRESETS[preset], preset, step: 0, slot: 0 }
}
export const initial = presetState('matched')
const fields = makeUrlCodec<State>({
  preset: choiceField(presetIds), mismatch: numberField(0, 100, 5), blockSize: numberField(1, 4, 1),
  seed: numberField(1, 100, 1), step: numberField(0, OUTPUT_LENGTH - 1, 1), slot: numberField(0, 4, 1),
})
export const codec: UrlStateCodec<State> = {
  encode: fields.encode,
  decode(params) {
    const id = presetIds.find(p => p === params.get('preset')) ?? initial.preset
    const state = fields.decode(params, presetState(id))
    const blocks = runSpeculation(state)
    const step = Math.min(state.step, blocks.length - 1)
    return { ...state, step, slot: Math.min(state.slot, blocks[step]!.proposals.length) }
  },
}
