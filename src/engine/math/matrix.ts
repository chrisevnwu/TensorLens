import type { SeededRng } from './prng'

export class Matrix {
  readonly data: Float64Array

  constructor(readonly rows: number, readonly cols: number, data?: Float64Array) {
    if (![rows, cols].every((size) => Number.isSafeInteger(size) && size >= 0)) throw new RangeError('Invalid matrix shape')
    if (data && data.length !== rows * cols) throw new RangeError('Matrix shape does not match data')
    this.data = data ? data.slice() : new Float64Array(rows * cols)
  }

  static zeros(rows: number, cols: number) { return new Matrix(rows, cols) }

  static from2D(grid: readonly (readonly number[])[]) {
    const cols = grid[0]?.length ?? 0
    const result = new Matrix(grid.length, cols)
    grid.forEach((row, i) => {
      if (row.length !== cols) throw new RangeError('Ragged matrix')
      result.data.set(row, i * cols)
    })
    return result
  }

  static randomNormal(rows: number, cols: number, rng: SeededRng, std = 1) {
    const result = new Matrix(rows, cols)
    for (let i = 0; i < result.data.length; i++) result.data[i] = rng.nextGaussian(0, std)
    return result
  }

  static identity(n: number) {
    const result = new Matrix(n, n)
    for (let i = 0; i < n; i++) result.data[i * n + i] = 1
    return result
  }

  private index(r: number, c: number) {
    if (!Number.isInteger(r) || !Number.isInteger(c) || r < 0 || r >= this.rows || c < 0 || c >= this.cols) {
      throw new RangeError('Matrix index out of bounds')
    }
    return r * this.cols + c
  }

  get(r: number, c: number) { return this.data[this.index(r, c)]! }
  set(r: number, c: number, value: number) { this.data[this.index(r, c)] = value }
  row(r: number) {
    if (!Number.isInteger(r) || r < 0 || r >= this.rows) throw new RangeError('Matrix row out of bounds')
    return this.data.slice(r * this.cols, (r + 1) * this.cols)
  }
  to2D() { return Array.from({ length: this.rows }, (_, r) => Array.from(this.row(r))) }
  clone() { return new Matrix(this.rows, this.cols, this.data) }
  transpose() { return new Matrix(this.cols, this.rows).map((_, r, c) => this.get(c, r)) }

  matmul(other: Matrix) {
    if (this.cols !== other.rows) throw new RangeError('Incompatible matrix product')
    const output = new Matrix(this.rows, other.cols)
    for (let r = 0; r < this.rows; r++) {
      for (let k = 0; k < this.cols; k++) {
        const factor = this.data[r * this.cols + k]!
        for (let c = 0; c < other.cols; c++) {
          const i = r * other.cols + c
          output.data[i] = output.data[i]! + factor * other.data[k * other.cols + c]!
        }
      }
    }
    return output
  }

  private checkShape(other: Matrix) {
    if (this.cols !== other.cols || this.rows !== other.rows) throw new RangeError('Matrix shapes differ')
  }

  add(other: Matrix) {
    this.checkShape(other)
    return this.map((v, r, c) => v + other.get(r, c))
  }
  sub(other: Matrix) {
    this.checkShape(other)
    return this.map((v, r, c) => v - other.get(r, c))
  }
  scale(factor: number) { return this.map((v) => v * factor) }
  map(fn: (value: number, r: number, c: number) => number) {
    const output = new Matrix(this.rows, this.cols)
    for (let i = 0; i < this.data.length; i++) output.data[i] = fn(this.data[i]!, Math.floor(i / this.cols), i % this.cols)
    return output
  }
  frobeniusNorm() { return vectorNorm(this.data) }
}

type Vector = readonly number[] | Float64Array

function vectorNorm(x: ArrayLike<number>) {
  let norm = 0
  for (let i = 0; i < x.length; i++) norm = Math.hypot(norm, x[i]!)
  return norm
}

function maximum(x: Vector) {
  let max = -Infinity
  for (const value of x) max = Math.max(max, value)
  return max
}

export function stableSoftmax(logits: Vector, temperature = 1): number[] {
  const max = maximum(logits)
  if (max === -Infinity) return Array(logits.length).fill(0)
  const weights = Array.from(logits, value => {
    if (value === max) return 1
    if (value === -Infinity || max === Infinity || temperature <= 0) return 0
    return Math.exp((value - max) / temperature)
  })
  const total = weights.reduce((a, b) => a + b, 0)
  return weights.map(value => value / total)
}

export function logSumExp(values: Vector) {
  const max = maximum(values)
  if (!Number.isFinite(max)) return max
  let total = 0
  for (const v of values) total += Math.exp(v - max)
  return max + Math.log(total)
}

function sameLength(a: ArrayLike<number>, b: ArrayLike<number>) {
  if (a.length !== b.length) throw new RangeError('Vector lengths differ')
}

export function dotProduct(a: ArrayLike<number>, b: ArrayLike<number>) {
  sameLength(a, b)
  let total = 0
  for (let i = 0; i < a.length; i++) total += a[i]! * b[i]!
  return total
}

export function cosineSimilarity(a: ArrayLike<number>, b: ArrayLike<number>) {
  sameLength(a, b)
  const normA = vectorNorm(a), normB = vectorNorm(b)
  if (normA === 0 || normB === 0) return 0
  let total = 0
  for (let i = 0; i < a.length; i++) total += (a[i]! / normA) * (b[i]! / normB)
  return Math.min(1, Math.max(-1, total))
}

/** Shannon entropy in bits. */
export function shannonEntropy(probs: readonly number[]) {
  return probs.reduce((sum, p) => p > 0 ? sum - p * Math.log2(p) : sum, 0)
}

export function layerNormVector(x: readonly number[], eps = 1e-12) {
  const mean = x.reduce((sum, value) => sum + value / x.length, 0)
  const centered = x.map(v => v - mean)
  const std = vectorNorm(centered) / Math.sqrt(Math.max(1, x.length))
  const scale = Math.hypot(std, Math.sqrt(Math.max(eps, 0))) || 1
  return { out: centered.map(v => v / scale), mean, variance: std * std }
}

export function rmsNormVector(x: readonly number[], eps = 1e-12) {
  const rms = vectorNorm(x) / Math.sqrt(Math.max(1, x.length))
  const scale = Math.hypot(rms, Math.sqrt(Math.max(eps, 0))) || 1
  return { out: x.map(v => v / scale), rms }
}

export function mse(a: ArrayLike<number>, b: ArrayLike<number>) {
  sameLength(a, b)
  let result = 0
  for (let i = 0; i < a.length; i++) result += (a[i]! - b[i]!) ** 2 / a.length
  return result
}

/** A relative energy floor of 1e-24 bounds the display for exact reconstructions. */
export function sqnrDb(original: ArrayLike<number>, quantized: ArrayLike<number>) {
  sameLength(original, quantized)
  const signal = vectorNorm(original)
  let noise = 0
  for (let i = 0; i < original.length; i++) noise = Math.hypot(noise, original[i]! - quantized[i]!)
  if (!signal) return noise ? -240 : 0
  return noise ? 20 * (Math.log10(signal) - Math.log10(noise)) : 240
}
