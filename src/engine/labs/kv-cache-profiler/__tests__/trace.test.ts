import { expect, it } from 'vitest'
import { buildDecodeTrace } from '../trace'

it('runs the same causal prefill and eight greedy decode steps on both execution paths', () => {
  const frames = buildDecodeTrace()
  expect(frames).toHaveLength(9)
  for (const [step, frame] of frames.entries()) {
    const { cached, uncached } = frame
    expect(frame.step).toBe(step)
    expect(frame.phase).toBe(step === 0 ? 'prefill' : 'decode')
    expect(frame.length).toBe(step + 4)
    expect(frame.tokenIds).toHaveLength(frame.length)
    if (step) expect(frame.tokenIds.slice(0,-1)).toEqual(frames[step-1]!.tokenIds)
    const all = Array.from({ length: frame.length }, (_, i) => i)
    expect(uncached.queryRows).toEqual(all)
    expect(uncached.projectedRows).toEqual(all)
    expect(uncached.reusedRows).toEqual([])
    expect(cached.queryRows).toEqual(step === 0 ? all : [frame.length - 1])
    expect(cached.projectedRows).toEqual(cached.queryRows)
    expect(cached.reusedRows).toEqual(step === 0 ? [] : all.slice(0,-1))
    expect(cached.output).toHaveLength(frame.dim)
    expect(cached.output).toEqual(uncached.output)
    expect(cached.weights).toEqual(step === 0 ? uncached.weights : uncached.weights.slice(-1))
    for (const [i, row] of uncached.weights.entries()) {
      expect(row).toHaveLength(frame.length)
      expect(row.reduce((sum,p) => sum + p)).toBeCloseTo(1, 12)
      expect(row.slice(i+1).every(p => p === 0)).toBe(true)
    }
  }
})

it('counts all dense projection and attention products using two FLOPs per MAC', () => {
  const frames = buildDecodeTrace()
  expect(frames[0]!.cached.flops).toBe(2048)
  expect(frames[0]!.uncached.flops).toBe(2048)
  expect(frames[1]!.cached.flops).toBe(544)
  expect(frames[1]!.uncached.flops).toBe(2720)
  for (const [i, frame] of frames.entries()) {
    for (const kind of ['cached', 'uncached'] as const) {
      expect(frame[kind].cumulativeFlops).toBe(frames.slice(0,i+1).reduce((sum,f) => sum+f[kind].flops,0))
    }
    if (i) expect(frame.cached.flops).toBeLessThan(frame.uncached.flops)
  }
})

it('replays seeded states and makes attention respond to a different model seed', () => {
  expect(buildDecodeTrace(91)).toEqual(buildDecodeTrace(91))
  expect(buildDecodeTrace(91)[0]!.cached.output).not.toEqual(buildDecodeTrace(92)[0]!.cached.output)
})
