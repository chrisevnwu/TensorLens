import { expect, it } from 'vitest'
import { runSampling } from '../engine'

it('retains original probability mass throughout the truncation pipeline', () => {
  const result = runSampling({ logits: [.4,.35,.25].map(Math.log), counts: [0,0,0], temperature: 1,
    repetitionPenalty: 1, presencePenalty: 0, frequencyPenalty: 0, topK: 2, topP: .5, minP: 0 })
  expect(result.stages[2]![0]).toBeCloseTo(.4, 12)
  expect(result.stages[3]![1]).toBeCloseTo(.35, 12)
  expect(result.probabilities[0]).toBeCloseTo(.4 / .75, 12)
  expect(result.statuses).toEqual(['kept','kept','top-k'])
})
