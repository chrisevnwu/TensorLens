import { choiceField, makeUrlCodec, numberField, type UrlStateCodec } from '../../components/utils/useLabUrlState'
import { ALL_POSITIONS, POSITIONS } from '../../engine/labs/language-model-loss/engine'
import { LOSS_PRESETS, type LossPresetId } from '../../engine/labs/language-model-loss/presets'

export const presetIds = Object.keys(LOSS_PRESETS) as LossPresetId[]
interface State { preset: LossPresetId; gap: number; mask: number; step: number }
export function presetState(preset: LossPresetId): State {
  return { preset, ...LOSS_PRESETS[preset] }
}
export const initial = presetState('walkthrough')
const fields = makeUrlCodec<State>({
  preset: choiceField(presetIds), gap: numberField(0, 8, .1),
  mask: numberField(0, ALL_POSITIONS, 1), step: numberField(0, POSITIONS - 1, 1),
})
export const codec: UrlStateCodec<State> = {
  encode: fields.encode,
  decode(params) {
    const preset = presetIds.find(id => params.get('preset') === id) ?? initial.preset
    return fields.decode(params, presetState(preset))
  },
}
