import { describe, expect, it } from 'vitest'
import { evaluateSequence, scoreToken } from '../engine'

describe('next-token evaluation', () => {
  it('scores the observed token even when it loses the argmax', () => {
    const row = scoreToken([Math.log(3), 0], 1)
    expect(row.probabilities[0]).toBeCloseTo(.75, 12)
    expect(row.probabilities[1]).toBeCloseTo(.25, 12)
    expect(row.predicted).toBe(0)
    expect(row.loss).toBeCloseTo(Math.log(4), 12)
  })
})

it('measures held-out perplexity from the geometric mean of the seven observed probabilities', () => {
  // Six predictable targets get probability 1/2; the final exception gets 1/6.
  const run = evaluateSequence(Math.log(3))
  expect(run.rows.map(row => row.target)).toEqual([1, 2, 3, 0, 1, 2, 0])
  expect(run.accuracy).toBeCloseTo(6 / 7, 12)
  expect(run.totalLoss).toBeCloseTo(Math.log(384), 12)
  expect(run.meanLoss).toBeCloseTo(Math.log(384) / 7, 12)
  expect(run.perplexity).toBeCloseTo(384 ** (1 / 7), 12)
})

it('assigns four-way uniform predictions a perplexity of four, including on a single target', () => {
  for (const mask of [1, 64, 127]) {
    const result = evaluateSequence(0, mask)
    expect(result.meanLoss).toBeCloseTo(Math.log(4), 12)
    expect(result.perplexity).toBeCloseTo(4, 12)
    expect(result.rows.every(row => row.predicted === 0)).toBe(true)
  }
})

it('removes the exception from both sum and denominator without changing any prediction', () => {
  const complete = evaluateSequence(Math.log(3))
  const masked = evaluateSequence(Math.log(3), 63)
  expect(masked.count).toBe(6)
  expect(masked.accuracy).toBe(1)
  expect(masked.totalLoss).toBeCloseTo(6 * Math.log(2), 12)
  expect(masked.perplexity).toBeCloseTo(2, 12)
  expect(masked.rows.map(row => row.probabilities)).toEqual(complete.rows.map(row => row.probabilities))
  const empty = evaluateSequence(3, 0)
  expect(empty).toMatchObject({count: 0, totalLoss: 0, meanLoss: null, perplexity: null, accuracy: null})
})

it('penalizes a confident mistake while preserving the same top-1 answers', () => {
  const cautious = evaluateSequence(Math.log(3))
  const confident = evaluateSequence(8)
  expect(confident.rows.map(row => row.predicted)).toEqual(cautious.rows.map(row => row.predicted))
  expect(confident.rows[0]!.loss).toBeLessThan(cautious.rows[0]!.loss)
  expect(confident.rows[6]!.loss).toBeGreaterThan(8)
  expect(confident.meanLoss!).toBeGreaterThan(cautious.meanLoss!)
  expect(evaluateSequence(8, 63).perplexity!).toBeLessThan(1.01)
})

it('keeps log loss finite under probability underflow and preserves logit shifts', () => {
  const extreme = scoreToken([1000, 0], 1)
  expect(extreme.probabilities[1]).toBe(0)
  expect(extreme.loss).toBe(1000)
  expect(scoreToken([1200, 200], 1)).toEqual(extreme)
  expect(scoreToken([1e18, 1e18], 1).loss).toBeCloseTo(Math.log(2), 12)
})

it('rejects an invalid position mask, logit gap or token identifier', () => {
  expect(() => evaluateSequence(1, 128)).toThrow(RangeError)
  expect(() => evaluateSequence(-1)).toThrow(RangeError)
  expect(() => scoreToken([], 0)).toThrow(RangeError)
  expect(() => scoreToken([0, 1], 2)).toThrow(RangeError)
  expect(() => scoreToken([0, NaN], 1)).toThrow(RangeError)
})
