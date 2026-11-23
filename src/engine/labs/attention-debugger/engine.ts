import { Matrix, stableSoftmax } from '../../math/matrix'
import { createRng } from '../../math/prng'
import { buildTopology, type AttentionTopology } from './topology'

export type MaskType = 'causal' | 'bidirectional' | 'sliding'
export interface AttentionConfig {
  tokens: readonly string[]
  numHeads: number
  useScaling: boolean
  logitScale: number
  maskType: MaskType
  windowSize: number
  topology: AttentionTopology
}

export interface AttentionHead {
  Wq: Matrix
  Wk: Matrix
  Wv: Matrix
  Q: Matrix
  K: Matrix
  V: Matrix
  raw: Matrix
  scaled: Matrix
  masked: Matrix
  weights: Matrix
  output: Matrix
  meanEntropy: number
  peak: number
  maskDensity: number
}

export interface AttentionResult {
  tokens: string[]
  X: Matrix
  heads: AttentionHead[]
  concat: Matrix
  Wo: Matrix
  output: Matrix
  logitScale: number
  topology: ReturnType<typeof buildTopology>
}

const MODEL_DIM = 12
const MAX_TOKENS = 8
const POSITION_ANGLE = 2 * Math.PI / (MAX_TOKENS + 1)

export function parseTokens(text: string) {
  return text.split(/[\s,，]+/u).filter(Boolean).slice(0, MAX_TOKENS)
}

function hash(text: string, seed: number) {
  let state = seed >>> 0
  for (const char of text) state = Math.imul(state ^ char.codePointAt(0)!, 16777619)
  return state >>> 0
}

// Small semantic families make similar vocabulary share a feature direction in the teaching model.
const families = [
  ['the', 'a', 'an', 'this', 'that'], ['cat', 'cats', 'dog', 'dogs', 'kitten', 'puppy'],
  ['sit', 'sits', 'sat', 'stand', 'stands', 'stood'], ['on', 'in', 'at', 'to', 'from'],
  ['token', 'tokens', 'word', 'words'], ['attend', 'attends', 'attention'],
]

function embeddings(tokens: string[], seed: number) {
  const matrix = Matrix.zeros(tokens.length, MODEL_DIM)
  tokens.forEach((token, pos) => {
    const word = token.toLowerCase()
    const category = families.find(group => group.includes(word))?.[0] ?? word
    const semantic = createRng(hash(category, seed)), lexical = createRng(hash(word, seed ^ 0x4551))
    matrix.set(pos, 0, Math.cos(POSITION_ANGLE * pos))
    matrix.set(pos, 1, Math.sin(POSITION_ANGLE * pos))
    const categoryVector = Array.from({ length: 3 }, () => semantic.nextGaussian())
    const norm = Math.hypot(...categoryVector) || 1
    for (let i = 0; i < 3; i++) matrix.set(pos, 2 + i, categoryVector[i]! / norm)
    for (let i = 5; i < MODEL_DIM; i++) matrix.set(pos, i, lexical.nextGaussian(0, 0.5))
  })
  return matrix
}

function projection(head: number, headDim: number, query: boolean, seed: number) {
  const rng = createRng(hash(`${query ? 'q' : 'k'}/${head}`, seed))
  // Weak lexical features break positional ties without hard-coding attention probabilities.
  const weights = Matrix.randomNormal(MODEL_DIM, headDim, rng, head === 3 ? 0.12 : 0.008)
  if (head < 2) {
    const phase = query && head === 0 ? -POSITION_ANGLE : 0
    weights.set(0, 0, 2.5 * Math.cos(phase))
    weights.set(1, 0, -2.5 * Math.sin(phase))
    weights.set(0, 1, 2.5 * Math.sin(phase))
    weights.set(1, 1, 2.5 * Math.cos(phase))
  } else if (head === 2) {
    for (let i = 0; i < 3; i++) weights.set(2 + i, i, 2.4)
  }
  return weights
}

function normalizeRows(masked: Matrix) {
  const weights = Matrix.zeros(masked.rows, masked.cols)
  let entropy = 0, peak = 0, allowed = 0
  for (let i = 0; i < masked.rows; i++) {
    const row = stableSoftmax(masked.row(i))
    weights.data.set(row, i * masked.cols)
    row.forEach((p, j) => {
      if (p > 0) entropy -= p * Math.log(p)
      if (masked.get(i, j) !== -Infinity) allowed++
      peak = Math.max(peak, p)
    })
  }
  return { weights, meanEntropy: entropy / Math.max(1, masked.rows), peak, maskDensity: allowed / Math.max(1, masked.data.length) }
}

export function simulateAttention(config: AttentionConfig, seed = 42): AttentionResult {
  if (![1, 2, 4].includes(config.numHeads)) throw new RangeError('Unsupported query head count')
  const tokens = config.tokens.filter(token => token.trim().length > 0).slice(0, MAX_TOKENS)
  const X = embeddings(tokens, seed)
  const topology = buildTopology(config.numHeads, config.topology, MODEL_DIM)
  const { headDim, sharingRatio } = topology
  const logitScale = config.logitScale
  const kvHeads = Array.from({ length: topology.numKvHeads }, (_, group) => {
    const representative = group * sharingRatio
    const Wk = projection(representative, headDim, false, seed)
    const Wv = Matrix.randomNormal(MODEL_DIM, headDim, createRng(hash(`v/${representative}`, seed)), 1 / Math.sqrt(MODEL_DIM))
    return { Wk, Wv, K: X.matmul(Wk), V: X.matmul(Wv) }
  })
  const heads = topology.links.map((group, h) => {
    const kv = kvHeads[group]!
    const Wq = projection(h, headDim, true, seed)
    const Q = X.matmul(Wq)
    const raw = Q.matmul(kv.K.transpose()).scale(logitScale ** 2)
    const scaled = raw.scale(config.useScaling ? 1 / Math.sqrt(headDim) : 1)
    const masked = scaled.map((value, i, j) => {
      if (config.maskType !== 'bidirectional' && j > i) return -Infinity
      if (config.maskType === 'sliding' && i - j >= Math.max(1, config.windowSize)) return -Infinity
      return value
    })
    const stats = normalizeRows(masked)
    return { ...kv, Wq, Q, raw, scaled, masked, ...stats, output: stats.weights.matmul(kv.V) }
  })
  const concat = Matrix.zeros(tokens.length, MODEL_DIM).map((_, i, c) => heads[Math.floor(c / headDim)]!.output.get(i, c % headDim))
  const Wo = Matrix.randomNormal(MODEL_DIM, MODEL_DIM, createRng(hash('o', seed)), 1 / Math.sqrt(MODEL_DIM))
  return { tokens, X, heads, topology, concat, Wo, output: concat.matmul(Wo), logitScale }
}

export function inspectCell(result: AttentionResult, headIndex: number, i: number, j: number) {
  const head = result.heads[headIndex]
  if (!head) throw new RangeError('Unknown query head')
  const q = Array.from(head.Q.row(i)), k = Array.from(head.K.row(j))
  const weight = head.weights.get(i, j)
  return {
    q, k, terms: q.map((v, c) => v * k[c]! * result.logitScale ** 2),
    rawScore: head.raw.get(i, j), scaledScore: head.scaled.get(i, j), maskedScore: head.masked.get(i, j), weight,
    valueContribution: Array.from(head.V.row(j), value => weight * value),
  }
}
