import { choiceField, makeUrlCodec, numberField, type UrlStateCodec } from '../../components/utils/useLabUrlState'
import { UPDATES, VOTES, type DpoConfig } from '../../engine/labs/preference-dpo/engine'
import { DPO_PRESETS, type DpoPreset } from '../../engine/labs/preference-dpo/presets'

export const modes = ['policy', 'fit', 'loss'] as const
export const presetIds = Object.keys(DPO_PRESETS) as DpoPreset[]

export interface State extends DpoConfig {
  preset: DpoPreset
  view: typeof modes[number]
  step: number
}

export function presetState(preset: DpoPreset): State {
  return { ...DPO_PRESETS[preset], preset, step: 0, view: preset === 'split' ? 'fit' : 'policy' }
}

export const initial = presetState('consensus')
const fields = makeUrlCodec<State>({
  preset: choiceField(presetIds), view: choiceField(modes), step: numberField(0, UPDATES, 1),
  votesA: numberField(0, VOTES, 1), referencePercentA: numberField(5, 95, 1),
  beta: numberField(.1, 2, .1), rate: numberField(.05, 1, .05),
})

export const codec: UrlStateCodec<State> = {
  encode: fields.encode,
  decode(params) {
    const id = presetIds.find(preset => preset === params.get('preset')) ?? initial.preset
    return fields.decode(params, presetState(id))
  },
}
