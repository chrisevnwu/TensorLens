import { expect, it } from 'vitest'
import { computeProfile } from '../../engine/labs/kv-cache-profiler/engine'
import { HARDWARE_PROFILES } from '../../engine/labs/kv-cache-profiler/profiles'
import { codec, initial, selectedModel } from './config'

it('restores a custom model and maps an incompatible group count to a valid divisor', () => {
  const state = codec.decode(new URLSearchParams('modelId=custom&qHeads=15&kvHeads=8&layers=9&headDim=32&hiddenSize=96&contextLength=1024&step=4'), initial)
  const model = selectedModel(state)
  expect(model).toMatchObject({ id:'custom', layers:9, qHeads:15, kvHeads:5, headDim:32, hiddenSize:96 })
  expect(codec.decode(new URLSearchParams(codec.encode(state)), initial)).toEqual(state)
  const result = computeProfile({ ...state, model, hardware:HARDWARE_PROFILES[0], attentionType:'GQA' })
  expect(result.kvBytes).toBe(5_898_240)
})
