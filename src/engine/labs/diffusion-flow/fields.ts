import type { Point, TargetPoint } from './data'

export type NoiseSchedule = 'linear' | 'cosine'
export type TargetClass = 'all' | 'a' | 'b'

const steps = 100
const cleanVariance = 0.06 ** 2
function cosinePower(t: number) {
  return Math.cos((t + 0.008) / 1.008 * Math.PI / 2) ** 2
}

function buildSchedule(schedule: NoiseSchedule) {
  const cumulative = [1]
  for (let i = 1; i <= steps; i++) {
    // Improved-DDPM linear betas use the original 1000-step schedule rescaled to T.
    const beta = schedule === 'linear' ? (1000 / steps) * (0.0001 + 0.0199 * (i - 1) / (steps - 1))
      : Math.min(0.999, 1 - cosinePower(i / steps) / cosinePower((i - 1) / steps))
    cumulative.push(cumulative[i - 1]! * (1 - beta))
  }
  return cumulative
}
const schedules = { linear: buildSchedule('linear'), cosine: buildSchedule('cosine') }

function unitTime(t: number) {
  if (!(t >= 0 && t <= 1)) throw new RangeError('Time or cumulative signal power must lie in [0,1]')
}

/** Cumulative signal power at normalized time, log-linear between the 100 base steps. */
export function alphaBar(schedule: NoiseSchedule, t: number): number {
  unitTime(t)
  const index = t * steps
  const i = Math.floor(index)
  const values = schedules[schedule]
  const a = values[i]!
  if (i === index) return a
  return a * Math.pow(values[i + 1]! / a, index - i)
}

export function forwardSample(x0: Point, epsilon: Point, alpha: number): Point {
  unitTime(alpha)
  const signal = Math.sqrt(alpha), noise = Math.sqrt(1 - alpha)
  return { x: signal * x0.x + noise * epsilon.x, y: signal * x0.y + noise * epsilon.y }
}

function shiftedWeight(logit: number, max: number, variance: number) {
  if (logit === max) return 1
  return variance === 0 ? 0 : Math.exp((logit - max) / variance)
}

/** The log likelihoods share a common -|x|²/2 term; removing it preserves distant-query precision. */
function numerator(q: Point, p: Point, gain: number) {
  return gain * (q.x * p.x + q.y * p.y - gain * 0.5 * (p.x * p.x + p.y * p.y))
}

function posteriorMeans(q: Point, targets: readonly TargetPoint[], gain: number, variance: number, targetClass: TargetClass) {
  if (!targets.length) throw new RangeError('At least one mixture component is required')
  let maxA = -Infinity, maxB = -Infinity
  for (const p of targets) {
    const n = numerator(q, p, gain)
    if (p.label === 0) maxA = Math.max(maxA, n)
    else maxB = Math.max(maxB, n)
  }

  // Shift each class independently, so a very unlikely requested class retains its own posterior.
  let massA = 0, ax = 0, ay = 0, massB = 0, bx = 0, by = 0
  for (const p of targets) {
    const w = shiftedWeight(numerator(q, p, gain), p.label === 0 ? maxA : maxB, variance)
    if (p.label === 0) { massA += w; ax += w * p.x; ay += w * p.y }
    else { massB += w; bx += w * p.x; by += w * p.y }
  }
  const largest = Math.max(maxA, maxB)
  const scaleA = shiftedWeight(maxA, largest, variance), scaleB = shiftedWeight(maxB, largest, variance)
  const mass = scaleA * massA + scaleB * massB
  const unconditional = { x: (ax * scaleA + bx * scaleB) / mass, y: (ay * scaleA + by * scaleB) / mass }
  let conditional = unconditional
  if (targetClass === 'a' && massA > 0) conditional = { x: ax / massA, y: ay / massA }
  if (targetClass === 'b' && massB > 0) conditional = { x: bx / massB, y: by / massB }
  return { unconditional, conditional }
}

function guidedMean(all: Point, conditional: Point, scale: number): Point {
  if (scale === 0 || all === conditional) return all
  if (scale === 1) return conditional
  return { x: all.x + scale * (conditional.x - all.x), y: all.y + scale * (conditional.y - all.y) }
}

export function denoise(q: Point, targets: readonly TargetPoint[], alpha: number, targetClass: TargetClass = 'all', cfgScale = 1) {
  unitTime(alpha)
  const gain = Math.sqrt(alpha), variance = 1 - alpha + alpha * cleanVariance
  const { unconditional, conditional } = posteriorMeans(q, targets, gain, variance, targetClass)
  const x0 = guidedMean(unconditional, conditional, cfgScale)
  const rx = q.x - gain * x0.x, ry = q.y - gain * x0.y
  const noise = Math.sqrt(Math.max(1 - alpha, 1e-6))
  return { x0, unconditionalX0: unconditional, conditionalX0: conditional,
    epsilon: { x: rx / noise, y: ry / noise },
    score: { x: -rx / variance, y: -ry / variance } }
}

/** Marginal velocity of X_t=(1-t)Z+tY, with the endpoint velocity denominator bounded by 0.02. */
export function flowVelocity(q: Point, targets: readonly TargetPoint[], t: number, targetClass: TargetClass = 'all', cfgScale = 1): Point {
  unitTime(t)
  const { unconditional, conditional } = posteriorMeans(q, targets, t, (1 - t) ** 2, targetClass)
  const mean = guidedMean(unconditional, conditional, cfgScale)
  const remaining = Math.max(1 - t, 0.02)
  return { x: (mean.x - q.x) / remaining, y: (mean.y - q.y) / remaining }
}
