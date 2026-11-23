import { booleanField, choiceField, makeUrlCodec, numberField, type UrlStateCodec } from '../../components/utils/useLabUrlState'
import { arrangements, type Arrangement } from '../../engine/labs/image-text-contrastive/engine'

export const views = ['cosine', 'image', 'caption'] as const

export interface State {
  preset: Arrangement
  order: Arrangement
  temperature: number
  broad: boolean
  view: typeof views[number]
  step: number
  column: number
}

export function presetState(preset: Arrangement): State {
  return { preset, order: preset, temperature: preset === 'swapped' ? .25 : .5, broad: false, view: 'cosine', step: 0, column: 0 }
}

export const initial = presetState('matched')
const fields = makeUrlCodec<State>({
  preset: choiceField(arrangements), order: choiceField(arrangements), temperature: numberField(.05, 1, .05),
  broad: booleanField, view: choiceField(views), step: numberField(0, 2, 1), column: numberField(0, 2, 1),
})
export const codec: UrlStateCodec<State> = {
  encode: fields.encode,
  decode(params) {
    const preset = arrangements.find(id => id === params.get('preset')) ?? initial.preset
    return fields.decode(params, presetState(preset))
  },
}
