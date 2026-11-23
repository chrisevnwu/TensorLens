import { expect, it } from 'vitest'
import { contrastiveBatch, runExperiment } from '../engine'

const basis = [[1, 0], [0, 1]]
it('scores a hand-computable orthogonal two-pair batch in each direction', () => {
  const result = contrastiveBatch(basis, [[3, 0], [0, 7]], 1 / Math.log(3))
  expect(result.cosines).toEqual([[1, 0], [0, 1]])
  expect(result.byImage[0]![0]).toBeCloseTo(.75, 12)
  expect(result.byCaption[1]![0]).toBeCloseTo(.25, 12)
  expect(result.loss).toBeCloseTo(Math.log(4 / 3), 12)
  expect(result.imageHits).toBe(2)
  expect(result.captionHits).toBe(2)
})

it('normalizes across the two different axes independently', () => {
  const r = contrastiveBatch(basis, [[1, 0], [1, 0]], 1 / Math.log(3))
  expect(r.byImage).toEqual([[.5, .5], [.5, .5]])
  expect(r.byCaption[1]![0]).toBeCloseTo(.75, 12)
  expect(r.imageLoss).toBeCloseTo(Math.log(2), 12)
  expect(r.captionLoss).toBeCloseTo(-Math.log(.75 * .25) / 2, 12)
  expect(r.loss).toBeCloseTo((r.imageLoss + r.captionLoss) / 2, 12)
})
it('is unchanged under independent positive rescaling and handles extreme finite magnitudes', () => {
  const lhs = contrastiveBatch(basis, basis, .5)
  const rescaled = contrastiveBatch([[1e308, 0], [0, 1e-310]], [[1e-310, 0], [0, 1e308]], .5)
  expect(rescaled).toEqual(lhs)
})
it('keeps severe mismatch loss finite after its probability underflows', () => {
  const r = contrastiveBatch(basis, basis.slice().reverse(), .0001)
  expect(r.byImage[0]![0]).toBe(0)
  expect(r.loss).toBeCloseTo(10000)
  expect(contrastiveBatch([[1]], [[-3]], .05).loss).toBe(0)
})
it('rejects invalid batches, cosine operands and temperatures', () => {
  for (const [images, captions] of [[[], []], [basis, [[1, 0]]], [basis, [[0, 0], [1, 0]]], [basis, [[Infinity, 0], [0, 1]]], [basis, [[1], [0]]]] as const)
    expect(() => contrastiveBatch(images, captions, 1)).toThrow(RangeError)
  for (const t of [NaN, 0, -1, Infinity]) expect(() => contrastiveBatch(basis, basis, t)).toThrow(RangeError)
})

it('preserves a jointly permuted batch while a caption-only swap raises both losses by 1/(3τ)', () => {
  for (const t of [.05, .25, 1]) {
    const reference = runExperiment('matched', t, false)
    const joint = runExperiment('reordered', t, false)
    const broken = runExperiment('swapped', t, false)
    expect(joint.loss).toBeCloseTo(reference.loss, 12)
    expect(joint.images[0]).toBe('triangle')
    expect(reference.imageHits).toBe(3)
    expect(broken.imageHits).toBe(1)
    expect(broken.captionHits).toBe(1)
    expect(broken.imageLoss - reference.imageLoss).toBeCloseTo(1 / (3 * t), 12)
    expect(broken.captionLoss - reference.captionLoss).toBeCloseTo(1 / (3 * t), 12)
  }
})
it('drops only the count feature for a broad caption and produces equal cosine scores for the two circular images', () => {
  const r = runExperiment('matched', .5, true)
  expect(r.captionFeatures[1]).toEqual([1, 0, 0, 0])
  expect(r.cosines[0]![1]).toBeCloseTo(Math.SQRT1_2, 12)
  expect(r.byCaption[1]![0]).toBe(r.byCaption[1]![1])
  expect(r.byImage[0]![1]).not.toBeCloseTo(r.byCaption[1]![0]!, 3)
  for (const row of [...r.byCaption, ...r.byImage]) expect(row.reduce((a, b) => a + b)).toBeCloseTo(1, 12)
})
