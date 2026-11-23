import { choiceField, makeUrlCodec, numberField, type UrlStateCodec } from '../../components/utils/useLabUrlState'
import { UPDATES, type DistillConfig } from '../../engine/labs/knowledge-distillation/engine'
import { DISTILL_PRESETS, type DistillPreset } from '../../engine/labs/knowledge-distillation/presets'

export const modes = ['predictions', 'training'] as const
export const classes = ['violin', 'viola', 'trumpet'] as const
export const presetIds = Object.keys(DISTILL_PRESETS) as DistillPreset[]

export interface State extends DistillConfig {
  preset: DistillPreset
  view: typeof modes[number]
  focus: typeof classes[number]
  step: number
}

export function presetState(preset: DistillPreset): State {
  return { ...DISTILL_PRESETS[preset], preset, view: 'predictions', focus: preset === 'swap-runner-up' ? 'trumpet' : 'viola', step: 0 }
}

export const initial = presetState('hard-target')
const fields = makeUrlCodec<State>({
  preset: choiceField(presetIds), view: choiceField(modes), focus: choiceField(classes), step: numberField(0, UPDATES, 1),
  alpha: numberField(0, 1, .05), temperature: numberField(1, 8, .5), tail: numberField(-2, 2, .25),
})

export const codec: UrlStateCodec<State> = {
  encode: fields.encode,
  decode(params) {
    const preset = presetIds.find(id => id === params.get('preset')) ?? initial.preset
    return fields.decode(params, presetState(preset))
  },
}
