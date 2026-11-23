import { expect, it } from 'vitest'
import { createRng } from '../../../math/prng'
import { dotProduct } from '../../../math/matrix'
import { effectiveBase, rotateVector, simulateRoPE, sinusoidalVector, type ScalingMode } from '../engine'
import { ROPE_PRESETS } from '../presets'

const modes: ScalingMode[] = ['none', 'pi', 'ntk']
const dims = [8, 12, 16]
const standard = ROPE_PRESETS[0]

it.each(modes)('preserves total and plane-wise norms for arbitrary vectors, bases and positions (%s)', mode => {
  const rng = createRng(193)
  for (const dim of dims) {
    for (const base of [100, 777, 10000, 500000]) {
      for (const position of [-16384, -5, 0, 64, 12345]) {
        const x = Array.from({ length: dim }, () => rng.nextGaussian())
        const rotated = rotateVector(x, position, base, mode, 7)
        expect(Math.abs(Math.hypot(...rotated) - Math.hypot(...x))).toBeLessThan(1e-10)
        for (let i = 0; i < dim; i += 2) {
          expect(Math.abs(Math.hypot(rotated[i]!, rotated[i + 1]!) - Math.hypot(x[i]!, x[i + 1]!))).toBeLessThan(1e-10)
        }
      }
    }
  }
})

it.each(modes)('preserves relative scores under positive and negative common shifts (%s)', mode => {
  const rng = createRng(82)
  for (const dim of dims) {
    const q = Array.from({ length: dim }, () => rng.nextGaussian())
    const k = Array.from({ length: dim }, () => rng.nextGaussian())
    const dot = (m: number, n: number) => dotProduct(rotateVector(q, m, 10000, mode, 7), rotateVector(k, n, 10000, mode, 7))
    for (const [m, n] of [[12, 5], [3, 28], [0, 0]] as const) {
      for (const shift of [-16384, -32, 5, 32, 16384]) {
        expect(Math.abs(dot(m + shift, n + shift) - dot(m, n))).toBeLessThan(1e-10)
      }
    }
  }
})

it.each(modes)('rotates the origin by the identity exactly and preserves zero vectors (%s)', mode => {
  const x = [-3, 8, 4, 1, -0.25, 0.25, 5, -1]
  expect(rotateVector(x, 0, 500000, mode, 4)).toEqual(x)
  expect(rotateVector(Array(8).fill(0), 12, 100, mode, 4).every(v => v === 0)).toBe(true)
})

it('rotates the first axis by the specified angle and adds the sine/cosine pair in additive PE', () => {
  const x = [1, 0, 0, 1, 0.2, 0.3, -1, 2]
  const p = Math.PI / 2
  const rotated = rotateVector(x, p, 100, 'none', 1)
  expect(rotated[0]).toBeCloseTo(0, 13)
  expect(rotated[1]).toBeCloseTo(1, 13)
  expect(rotated[2]).toBeCloseTo(-Math.sin(p * 100 ** (-2 / 8)), 13)
  const pe = sinusoidalVector(x, p, 100)
  for (let i = 0; i < x.length; i += 2) {
    const phase = p * 100 ** (-i / x.length)
    expect(pe[i]).toBeCloseTo(x[i]! + Math.sin(phase), 13)
    expect(pe[i + 1]).toBeCloseTo(x[i + 1]! + Math.cos(phase), 13)
  }
})

it('changes the NTK base by the specified exponent while preserving the fastest frequency', () => {
  for (const d of dims) {
    let previous = 10000
    for (const scale of [2, 4, 8]) {
      const ntk = effectiveBase(10000, d, 'ntk', scale)
      expect(ntk).toBeCloseTo(10000 * scale ** (d / (d - 2)), 10)
      expect(ntk).toBeGreaterThan(previous)
      previous = ntk
      const config = { ...standard, dim: d, scaleFactor: scale }
      const base = simulateRoPE({ ...config, scalingMode: 'none' })
      const pi = simulateRoPE({ ...config, scalingMode: 'pi' })
      const scaled = simulateRoPE({ ...config, scalingMode: 'ntk' })
      expect(scaled.planes[0]!.relativeAngle).toBeCloseTo(base.planes[0]!.relativeAngle, 12)
      expect(pi.planes[0]!.relativeAngle * scale).toBeCloseTo(base.planes[0]!.relativeAngle, 12)
      expect(scaled.planes.at(-1)!.frequency * scale).toBeCloseTo(base.planes.at(-1)!.frequency, 13)
    }
  }
})

it.each(ROPE_PRESETS)('derives each of the 65 chart samples and its live marker from real vectors for $id', preset => {
  for (const [m,n] of [[5, 12], [64, 0], [12,12]] as const) {
    for (const mode of modes) {
      const config = { ...preset, m, n, offset: 32, scalingMode: mode, scaleFactor: 4 }
      const result = simulateRoPE(config)
      expect(result.curve).toHaveLength(65)
      expect(result.planes).toHaveLength(config.dim / 2)
      expect(result.relativeOffset).toBe(m - n)
      expect(Math.abs(result.unshiftedDot - result.dot)).toBeLessThan(1e-10)
      expect(result.normRatio).toBeCloseTo(1, 12)
      const anchor = n + config.offset
      for (const [i, point] of result.curve.entries()) {
        expect(point.distance).toBe(i)
        const query = anchor + (m < n ? -i : i)
        const expected = dotProduct(rotateVector(result.q, query, config.ropeBase, mode, 4), rotateVector(result.k, anchor, config.ropeBase, mode, 4))
        expect(Math.abs(point[mode] - expected)).toBeLessThan(1e-10)
        const additive = dotProduct(sinusoidalVector(result.q, query, config.ropeBase), sinusoidalVector(result.k, anchor, config.ropeBase))
        expect(point.sinusoidal).toBeCloseTo(additive, 10)
      }
      expect(result.curve[Math.abs(m-n)]![mode]).toBeCloseTo(result.dot, 11)
    }
  }
})
it('is reproducible with a seed and changes the base vectors for different seeds', () => {
  expect(simulateRoPE(standard, 8)).toEqual(simulateRoPE(standard, 8))
  expect(simulateRoPE(standard, 8).q).not.toEqual(simulateRoPE(standard, 9).q)
})
