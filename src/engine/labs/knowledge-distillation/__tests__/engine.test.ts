import { expect, it } from 'vitest'
import { objective, trainDistillation, UPDATES } from '../engine'

it('recovers cross-entropy, KL and the logit gradient for a hand-calculated three-class example', () => {
  const result = objective([Math.log(6), Math.log(3), 0], [0, 0, 0], 1, .5)
  const kl = .6 * Math.log(1.8) + .3 * Math.log(.9) + .1 * Math.log(.3)
  expect(result.hardLoss).toBeCloseTo(Math.log(3), 12)
  expect(result.softKL).toBeCloseTo(kl, 12)
  expect(result.loss).toBeCloseTo(.5 * (Math.log(3) + kl), 12)
  for (const [i, target] of [.8, .15, .05].entries()) {
    expect(result.gradient[i]).toBeCloseTo(1/3 - target, 12)
  }
})

it('matches finite differences at non-unit temperature and is invariant to constant logit shifts', () => {
  const teacher = [3, -1, 1], student = [.75, -.55, .23], temperature = 3.5, weight = .65
  const fit = (logits: number[]) => objective(teacher, logits, temperature, weight)
  const expected = fit(student)
  for (let j = 0; j < student.length; j++) {
    const offset = (delta: number) => student.map((z, i) => z + (i === j ? delta : 0))
    const numerical = (fit(offset(1e-5)).loss - fit(offset(-1e-5)).loss) / 2e-5
    expect(expected.gradient[j]).toBeCloseTo(numerical, 7)
  }
  const shifted = objective(teacher.map(z => z + 1100), student.map(z => z - 1200), temperature, weight)
  expect(shifted.loss).toBeCloseTo(expected.loss, 10)
  expect(expected.gradient.reduce((sum, x) => sum + x)).toBeCloseTo(0, 12)
  const perfect = objective(teacher, teacher, temperature, 1)
  expect(perfect.softKL).toBe(0)
  expect(perfect.gradient).toEqual([0, 0, 0])
})

it('executes real paired gradient steps; hard labels cannot distinguish the two alternatives', () => {
  for (const tail of [-2, 0, 2]) for (const temperature of [1, 4, 8]) for (const alpha of [0, .45, 1]) {
    const trace = trainDistillation({ tail, temperature, alpha })
    expect(trace).toHaveLength(UPDATES + 1)
    const start = trace[0]!, end = trace[UPDATES]!
    start.student.probability.forEach(p => expect(p).toBeCloseTo(1/3, 14))
    trace.slice(1).forEach((frame, i) => {
      const prev = trace[i]!
      frame.logits.forEach((z, j) => expect(z).toBeCloseTo(prev.logits[j]! - .5 * prev.student.gradient[j]!, 13))
      expect(frame.student.loss).toBeLessThanOrEqual(prev.student.loss + 1e-12)
      expect(frame.baseline.probability[1]).toBe(frame.baseline.probability[2])
      if (alpha === 0) expect(frame.student.probability).toEqual(frame.baseline.probability)
    })
    expect(end.baseline.probability[0]).toBeGreaterThan(.9)
    if (alpha > 0) expect(Math.sign(end.student.probability[1]! - end.student.probability[2]!)).toBe(Math.sign(tail))
  }
})

it('softens the teacher toward uniform and permutes only the two non-winning predictions when their logits swap', () => {
  const run = (tail: number, temperature: number) => trainDistillation({ tail, temperature, alpha: 1 })
  const warm = run(2, 4), cold = run(2, 1), swapped = run(-2, 4)
  expect(warm[0]!.student.teacherSoft[0]).toBeLessThan(cold[0]!.student.teacherSoft[0]!)
  warm.forEach((f, i) => {
    const mirror = swapped[i]!.student.probability
    f.student.probability.forEach((p, j) => expect(p).toBeCloseTo(mirror[[0,2,1][j]!]!, 12))
  })
})

it('retains finite log probabilities in the loss when a class probability underflows', () => {
  const fit = objective([1000, 0, -1000], [-1000, 0, 1000], 1, .5)
  expect(fit.loss).toBeCloseTo(2000, 10)
  expect(fit.gradient.every(Number.isFinite)).toBe(true)
  expect(() => objective([0, 1, 2], [0, 0, 0], 0, 1)).toThrow(RangeError)
  expect(() => trainDistillation({ tail: 3, temperature: 1, alpha: 1 })).toThrow(RangeError)
})
