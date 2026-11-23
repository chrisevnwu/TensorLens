import { dotProduct } from '../../math/matrix'
import { createRng } from '../../math/prng'

export type ScalingMode = 'none' | 'pi' | 'ntk'
export type VectorPair = [number, number]

export interface RopeConfig {
  m: number
  n: number
  offset: number
  ropeBase: number
  dim: number
  scalingMode: ScalingMode
  scaleFactor: number
  compareSinusoidal: boolean
}

export interface RopePlane {
  index: number
  /** Angular velocity in radians per token, including position interpolation. */
  frequency: number
  qAngle: number
  kAngle: number
  relativeAngle: number
  q: VectorPair
  k: VectorPair
  rotatedQ: VectorPair
  rotatedK: VectorPair
}

export interface DistancePoint {
  distance: number
  none: number
  pi: number
  ntk: number
  sinusoidal: number
}

export interface RopeResult {
  q: number[]
  k: number[]
  rotatedQ: number[]
  rotatedK: number[]
  planes: RopePlane[]
  curve: DistancePoint[]
  relativeOffset: number
  dot: number
  unshiftedDot: number
  normRatio: number
  fastestAngle: number
  effectiveBase: number
}

export function effectiveBase(base: number, dim: number, mode: ScalingMode, scale: number) {
  if (!(base > 0) || !(scale > 0) || !Number.isFinite(base) || !Number.isFinite(scale)) {
    throw new RangeError('RoPE base and scale must be positive and finite')
  }
  if (!Number.isInteger(dim) || dim < 2 || dim % 2 !== 0) throw new RangeError('RoPE requires paired coordinates')
  return mode === 'ntk' && dim > 2 ? base * scale ** (dim / (dim - 2)) : base
}

function frequencies(dim: number, base: number, mode: ScalingMode, scale: number) {
  const scaledBase = effectiveBase(base, dim, mode, scale)
  return Array.from({ length: dim / 2 }, (_, i) => scaledBase ** (-2 * i / dim) / (mode === 'pi' ? scale : 1))
}

function rotate(x: readonly number[], position: number, frequencies: readonly number[]) {
  if (position === 0) return [...x]
  const result = Array<number>(x.length)
  for (let i = 0; i < frequencies.length; i++) {
    const phase = position * frequencies[i]!, sin = Math.sin(phase), cos = Math.cos(phase)
    const a = x[2 * i]!, b = x[2 * i + 1]!
    result[2 * i] = a * cos - b * sin
    result[2 * i + 1] = a * sin + b * cos
  }
  return result
}

export function rotateVector(x: readonly number[], position: number, base: number, mode: ScalingMode = 'none', scale = 1) {
  return rotate(x, position, frequencies(x.length, base, mode, scale))
}

function additive(x: readonly number[], position: number, angles: readonly number[]) {
  return x.map((value, j) => {
    const phase = position * angles[Math.floor(j / 2)]!
    return value + (j % 2 === 0 ? Math.sin(phase) : Math.cos(phase))
  })
}

export function sinusoidalVector(x: readonly number[], position: number, base: number) {
  return additive(x, position, frequencies(x.length, base, 'none', 1))
}

function pair(x: number[], plane: number): VectorPair {
  return [x[2 * plane]!, x[2 * plane + 1]!]
}

export function simulateRoPE(config: RopeConfig, seed = 42): RopeResult {
  const { dim, ropeBase: base, scalingMode: mode, scaleFactor: scale, m, n, offset } = config
  const rates = {
    none: frequencies(dim, base, 'none', scale),
    pi: frequencies(dim, base, 'pi', scale),
    ntk: frequencies(dim, base, 'ntk', scale),
  }
  const rng = createRng(seed)
  const q = Array.from({ length: dim }, () => rng.nextGaussian())
  const k = Array.from({ length: dim }, () => rng.nextGaussian())
  const anchor = n + offset, relativeOffset = m - n
  const rotatedQ = rotate(q, m + offset, rates[mode])
  const rotatedK = rotate(k, anchor, rates[mode])
  const planes = rates[mode].map((frequency, index) => ({
    index, frequency, qAngle: (m + offset) * frequency, kAngle: anchor * frequency,
    relativeAngle: relativeOffset * frequency,
    q: pair(q, index), k: pair(k, index), rotatedQ: pair(rotatedQ, index), rotatedK: pair(rotatedK, index),
  }))
  const sineKey = additive(k, anchor, rates.none)
  const curve = Array.from({ length: 65 }, (_, distance) => {
    const delta = m < n ? -distance : distance
    // Orthogonality cancels the common origin: <R_m q,R_n k> = <R_(m-n) q,k>.
    return {
      distance,
      none: dotProduct(rotate(q, delta, rates.none), k),
      pi: dotProduct(rotate(q, delta, rates.pi), k),
      ntk: dotProduct(rotate(q, delta, rates.ntk), k),
      sinusoidal: dotProduct(additive(q, anchor + delta, rates.none), sineKey),
    }
  })
  const norm = Math.hypot(...q)
  return {
    q, k, rotatedQ, rotatedK, planes, curve, relativeOffset,
    dot: dotProduct(rotatedQ, rotatedK),
    unshiftedDot: dotProduct(rotate(q, m, rates[mode]), rotate(k, n, rates[mode])),
    normRatio: norm ? Math.hypot(...rotatedQ) / norm : 1,
    fastestAngle: planes[0]!.relativeAngle, effectiveBase: effectiveBase(base, dim, mode, scale),
  }
}
