import { expect, it } from 'vitest'
import { initialOptimizerState, optimizerStep, OPTIMIZERS, runRace, type RaceConfig } from '../race'

const ravine: RaceConfig = { landscape: 'ravine', startX: 2, startY: 1.5, learningRate: .1,
  beta1: .9, beta2: .999, weightDecay: .1, lrSchedule: 'constant' }

it('follows the analytical SGD and heavy-ball updates on the ravine', () => {
  const frames = runRace(ravine, 2)
  expect(frames[1]!.points.sgd.x).toBeCloseTo(1.8, 12)
  expect(frames[1]!.points.sgd.y).toBeCloseTo(-2.1, 12)
  expect(frames[2]!.points.momentum.y).toBeCloseTo(-.3, 12)
  expect(frames[2]!.points.sgd.y).toBeCloseTo(2.94, 12)
})

it('bias-corrects both Adam moments at each step and decouples AdamW decay from the gradient', () => {
  const start = initialOptimizerState(2, -3)
  const one = optimizerStep('adam', start, { dx: 2, dy: -4 }, ravine)
  expect(one.x).toBeCloseTo(1.9, 8)
  expect(one.y).toBeCloseTo(-2.9, 8)
  const two = optimizerStep('adam', one, { dx: 0, dy: -4 }, ravine)
  const mHat = .18 / (1 - .9**2)
  const vHat = (.999*.004) / (1 - .999**2)
  expect(two.x).toBeCloseTo(one.x - .1*mHat/(Math.sqrt(vHat)+1e-8), 12)
  const plain = optimizerStep('adam', start, {dx:0,dy:0}, ravine)
  const decay = optimizerStep('adamw', start, {dx:0,dy:0}, ravine)
  expect([plain.x, plain.y]).toEqual([start.x, start.y])
  expect(decay.x).toBeCloseTo(.99 * start.x, 12)
  expect(decay.y).toBeCloseTo(.99 * start.y, 12)
  const rms = optimizerStep('rmsprop', start, {dx:2,dy:0}, {...ravine,beta2:.5})
  expect(rms.x).toBeCloseTo(2-.2/(Math.sqrt(2)+1e-8), 12)
})

it('converges with Adam, distinguishes a stalled exact saddle and an escaping nearby start', () => {
  const frames = runRace(ravine)
  expect(frames).toHaveLength(101)
  expect(frames[100]!.points.adam.loss).toBeLessThan(.05)
  expect(frames[40]!.points.adam.loss).toBeLessThan(.1 * frames[40]!.points.sgd.loss)
  const saddle = {...ravine,landscape:'saddle' as const,startX:.05,startY:.02}
  expect(runRace(saddle,30)[30]!.points.adam.loss).toBeLessThan(-.3)
  const exact = runRace({...saddle,startX:0,startY:0},30)
  for (const id of OPTIMIZERS) expect(exact.at(-1)!.points[id].loss).toBe(0)
})

it('retains the last real finite point and flags runaway proposals', () => {
  const frames = runRace({...ravine,landscape:'rosenbrock',learningRate:.3})
  expect(frames.at(-1)!.points.sgd.diverged).toBe(true)
  const index = frames.findIndex(frame => frame.points.sgd.diverged)
  expect(index).toBeGreaterThan(0)
  const last = frames[index-1]!.points.sgd
  for (const f of frames.slice(index)) expect(f.points.sgd).toEqual({...last,diverged:true})
  for (const f of frames) for (const id of OPTIMIZERS) {
    const {x,y,loss,gradNorm} = f.points[id]
    expect([x,y,loss,gradNorm].every(Number.isFinite)).toBe(true)
  }
})
