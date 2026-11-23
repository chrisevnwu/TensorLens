import { describe, expect, it } from 'vitest'
import { DPO_PRESETS } from '../presets'
import { evaluatePolicy, trainPreferences } from '../engine'

describe('two-completion DPO', () => {
  it('starts from an even predicted preference and a loss of log(2) at any frozen reference', () => {
    const referenceLogOdds = Math.log(4)
    const frame = evaluatePolicy(referenceLogOdds, referenceLogOdds, 1.5, .75)
    expect(frame.probabilityA).toBeCloseTo(.8, 12)
    expect(frame.predictedVoteA).toBe(.5)
    expect(frame.loss).toBeCloseTo(Math.log(2), 12)
    expect(frame.gradient).toBeCloseTo(-.375, 12)
    expect(frame.kl).toBeCloseTo(0, 12)
  })

  it('matches hand-calculated class losses and KL when A has odds of three to one', () => {
    const frame = evaluatePolicy(Math.log(3), 0, 1, .75)
    expect(frame.probabilityA).toBeCloseTo(.75)
    expect(frame.lossIfA).toBeCloseTo(Math.log(4/3), 12)
    expect(frame.lossIfB).toBeCloseTo(Math.log(4), 12)
    expect(frame.loss).toBeCloseTo(.5623351446188083, 12)
    expect(frame.kl).toBeCloseTo(.130812035941137, 12)
    expect(frame.gradient).toBeCloseTo(0, 12)
  })

  it.each([0, .2, .65, 1])('matches a finite difference for vote share %s', share => {
    const theta = -.27, delta = .00001
    const evaluate = (parameter: number) => evaluatePolicy(parameter, .8, 1.7, share)
    const numerical = (evaluate(theta + delta).loss - evaluate(theta - delta).loss) / (2 * delta)
    expect(evaluate(theta).gradient).toBeCloseTo(numerical, 8)
  })

  it('preserves A/B symmetry and finite values even at extreme log-odds', () => {
    const forward = evaluatePolicy(1000, -1000, 2, .25)
    const reverse = evaluatePolicy(-1000, 1000, 2, .75)
    expect(Object.values(forward).every(Number.isFinite)).toBe(true)
    expect(forward.probabilityA + forward.probabilityB).toBe(1)
    expect(forward.loss).toBeCloseTo(3000, 10)
    expect(forward.kl).toBeCloseTo(1000, 10)
    expect(forward.loss).toBe(reverse.loss)
    expect(forward.kl).toBe(reverse.kl)
    expect(forward.gradient).toBe(-reverse.gradient)
  })

  it('takes the exact full-batch update and lowers loss across a training run', () => {
    const trace = trainPreferences({ votesA: 20, referencePercentA: 50, beta: 1, rate: .5 })
    expect(trace).toHaveLength(61)
    expect(trace[0]!.logOdds).toBe(0)
    expect(trace[1]!.logOdds).toBe(.25)
    expect(trace[1]!.probabilityA).toBeCloseTo(.5621765008857981, 12)
    expect(trace.slice(1).every((frame,i) => frame.loss < trace[i]!.loss)).toBe(true)
    expect(trace.at(-1)!.probabilityA).toBeGreaterThan(.9)
  })
})

describe('preference datasets', () => {
  it('keeps a frozen policy at equilibrium for an evenly divided vote', () => {
    const trace = trainPreferences({ votesA: 10, referencePercentA: 80, beta: .5, rate: 1 })
    expect(trace.every(frame => Math.abs(frame.probabilityA - .8) < 1e-12 && frame.kl < 1e-12)).toBe(true)
  })

  it('fits a split vote and can reverse the initial policy preference', () => {
    const split = trainPreferences(DPO_PRESETS.split).at(-1)!
    expect(split.predictedVoteA).toBeCloseTo(.75, 2)
    const reversal = trainPreferences(DPO_PRESETS.reversal)
    expect(reversal[0]!.probabilityA).toBeCloseTo(.8, 12)
    expect(reversal.at(-1)!.probabilityA).toBeLessThan(.45)
    expect(reversal.at(-1)!.kl).toBeGreaterThan(.1)
  })

  it('fits the same votes with less policy drift at higher beta', () => {
    const low = trainPreferences({ ...DPO_PRESETS.split, beta: 1 }).at(-1)!
    const high = trainPreferences({ ...DPO_PRESETS.split, beta: 2 }).at(-1)!
    expect(low.predictedVoteA).toBeCloseTo(high.predictedVoteA, 2)
    expect(high.probabilityA).toBeCloseTo(Math.sqrt(3) / (1 + Math.sqrt(3)), 8)
    expect(high.kl).toBeLessThan(low.kl)
  })

  it('rejects unreachable vote counts, singular reference odds and nonfinite step sizes', () => {
    for (const change of [{ votesA: 21 }, { votesA: .2 }, { referencePercentA: 0 }, { rate: NaN }, { beta: Infinity }]) {
      expect(() => trainPreferences({ ...DPO_PRESETS.consensus, ...change })).toThrow(RangeError)
    }
  })
})
