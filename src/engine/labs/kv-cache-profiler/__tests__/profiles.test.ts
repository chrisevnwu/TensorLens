import { expect, it } from 'vitest'
import { computeProfile } from '../engine'
import { MODEL_PROFILES, HARDWARE_PROFILES } from '../profiles'

it('stores exactly 128 KiB per token for a single Llama 3 8B FP16 GQA sequence', () => {
  const p = computeProfile({ model:MODEL_PROFILES[0], hardware:HARDWARE_PROFILES[0], attentionType:'GQA',
    kvPrecision:'FP16', contextLength:8192, batchSize:1 })
  expect(p.kvBytes).toBe(1_073_741_824)
})
it('uses V3 latent dimensions for its cache and model width for activation buffers', () => {
  const p = computeProfile({ model:MODEL_PROFILES[3], hardware:HARDWARE_PROFILES[0], attentionType:'MLA',
    kvPrecision:'FP8', contextLength:8192, batchSize:1 })
  expect(p.kvBytes).toBe(287_834_112)
  expect(p.activationBytes).toBe(234_881_024)
  expect(p.isOom).toBe(true)
})
