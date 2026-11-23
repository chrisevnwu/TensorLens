import { expect, it } from 'vitest'
import { createRng } from '../../../math/prng'
import { dotProduct } from '../../../math/matrix'
import { simulateResidual } from '../engine'
import { NORM_PRESETS } from '../presets'

it('propagates the translation-preserving pre-LayerNorm residual gradient through every supported depth', () => {
  for (let numLayers = 4; numLayers <= 32; numLayers++) {
    const sumProbe = Array<number>(32).fill(1 / Math.sqrt(32))
    const result = simulateResidual({ ...NORM_PRESETS[0], numLayers, normType: 'layernorm', activation: 'gelu' }, 42, undefined, sumProbe)
    expect(result.trace.length).toBe(numLayers + 1)
    for (const frame of result.trace) {
      // Translating the block input translates the skip by exactly the same constant.
      expect(frame.gradient.reduce((a, b) => a + b, 0)).toBeCloseTo(Math.sqrt(32), 9)
      expect(frame.gradNorm).toBeGreaterThanOrEqual(1 - 1e-10)
      expect(frame.min).toBe(Math.min(...frame.x))
      expect(frame.max).toBe(Math.max(...frame.x))
    }
  }
})

it.each(['pre-norm', 'post-norm', 'none'] as const)('matches the full stack Jacobian to an independent directional difference for %s', placement => {
  const rng = createRng(154)
  const x = Array.from({ length: 32 }, () => rng.nextGaussian())
  const v = Array.from({ length: 32 }, () => rng.nextGaussian() / Math.sqrt(32))
  for (const useResidual of [true, false]) {
    for (const activation of ['relu', 'gelu', 'swiglu'] as const) {
      const config = { ...NORM_PRESETS[0], numLayers: 4, weightGain: 0.8, normType: 'rmsnorm' as const, useResidual, placement, activation }
      const actual = simulateResidual(config, 23, x)
      const loss = (h: number) => simulateResidual(config, 23, x.map((xi, i) => xi + h * v[i]!)).trace.at(-1)!.x[0]!
      const numerical = (loss(1e-5) - loss(-1e-5)) / 2e-5
      expect(dotProduct(actual.trace[0]!.gradient, v)).toBeCloseTo(numerical, 5)
    }
  }
})

it('traces a nonconstant scalar loss through the final Post-LayerNorm', () => {
  const result = simulateResidual(NORM_PRESETS[1])
  expect(result.trace.at(-1)!.gradient).toEqual([1, ...Array(31).fill(0)])
  expect(result.gradRatio).toBeGreaterThan(1e-6)
})

it('exposes reproducible raw, normalized and gradient trajectories and counts normalization operations', () => {
  const config = { ...NORM_PRESETS[0], numLayers: 4, outlierMag: 14 }
  const unspiked = simulateResidual({ ...config, outlierMag: 0 })
  const result = simulateResidual(config)
  expect(simulateResidual(config)).toEqual(result)
  const first = result.trace[0]!
  expect(first.x[0]! - unspiked.trace[0]!.x[0]!).toBeCloseTo(14, 12)
  expect(first.x.slice(1)).toEqual(unspiked.trace[0]!.x.slice(1))
  expect(Math.abs(first.layerNorm.reduce((a,b) => a+b,0) / 32)).toBeLessThan(1e-10)
  expect(Math.hypot(...first.rmsNorm)).toBeCloseTo(Math.sqrt(32), 7)
  expect([result.layerNormFlops, result.rmsNormFlops, result.flopsSaved]).toEqual([162, 98, 64])
  expect(result.normRatio).toBeCloseTo(result.finalNorm / first.norm, 12)
  expect(result.trace.at(-1)!.gradNorm).toBeCloseTo(1, 12)
})

it('keeps realistic pre-RMSNorm gradients measurable and offers an observable collapse or explosion', () => {
  // This is the gain learners can set to bring the gradient back into the challenge band.
  for (let numLayers = 24; numLayers <= 32; numLayers++) {
    const modern = simulateResidual({ ...NORM_PRESETS[0], numLayers, weightGain: 0.6 })
    expect(modern.gradRatio).toBeGreaterThanOrEqual(0.2)
    expect(modern.gradRatio).toBeLessThanOrEqual(5)
  }
  const deep = simulateResidual(NORM_PRESETS[2])
  expect(deep.normRatio > 10 || deep.normRatio < 0.05).toBe(true)
})

it.each(['relu', 'gelu', 'swiglu'] as const)('keeps 32-layer unnormalized %s diagnostics finite under maximum gain and outlier spikes', activation => {
  for (const useResidual of [false, true]) {
    const result = simulateResidual({ ...NORM_PRESETS[2], numLayers:32, weightGain:1.8, outlierMag:20, activation, useResidual })
    for (const f of result.trace) {
      expect([f.norm, f.mean, f.std, f.min, f.max, f.maxAbs, f.cosine, f.gradNorm, ...f.x, ...f.gradient].every(Number.isFinite)).toBe(true)
    }
  }
})
