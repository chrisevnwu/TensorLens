import { shannonEntropy, stableSoftmax } from '../../math/matrix'

export interface SamplingConfig {
  logits: readonly number[]
  counts: readonly number[]
  repetitionPenalty: number
  frequencyPenalty: number
  presencePenalty: number
  temperature: number
  topK: number
  topP: number
  minP: number
  greedy?: boolean
}
export type SamplingStatus = 'kept' | 'top-k' | 'top-p' | 'min-p'
export interface SamplingResult {
  adjustedLogits: number[]
  baseProbs: number[]
  probabilities: number[]
  stages: number[][]
  statuses: SamplingStatus[]
  order: number[]
  cumulative: number[]
  minThreshold: number
  survivors: number
  entropyBits: number
  perplexity: number
  top1: number
}

function validate(config: SamplingConfig) {
  if (!config.logits.length || config.counts.length !== config.logits.length || config.logits.some(Number.isNaN)) {
    throw new RangeError('Expected a nonempty logit vector and one occurrence count per token')
  }
  if (config.counts.some(n => !Number.isInteger(n) || n < 0)) throw new RangeError('Invalid token counts')
  if (!Number.isFinite(config.repetitionPenalty) || config.repetitionPenalty <= 0 ||
      ![config.frequencyPenalty, config.presencePenalty, config.temperature, config.topK, config.topP, config.minP].every(Number.isFinite)) {
    throw new RangeError('Invalid sampling parameters')
  }
}

export function runSampling(config: SamplingConfig): SamplingResult {
  validate(config)
  const n = config.logits.length
  const adjustedLogits = config.logits.map((value, i) => {
    const count = config.counts[i]!
    if (count === 0) return value
    const repeated = value > 0 ? value / config.repetitionPenalty : value * config.repetitionPenalty
    return repeated - config.frequencyPenalty * count - config.presencePenalty
  })
  const allMasked = adjustedLogits.every(x => x === -Infinity)
  const atTemperature = (temperature: number): number[] => allMasked ? Array(n).fill(1/n) : stableSoftmax(adjustedLogits, temperature)
  const penaltyProbs = atTemperature(1)
  const greedy = config.greedy || config.temperature <= 0
  const baseProbs = atTemperature(greedy ? 1 : config.temperature)
  const order = Array.from({ length: n }, (_, i) => i).sort((a, b) => {
    if (adjustedLogits[a] === adjustedLogits[b]) return a - b
    return adjustedLogits[b]! > adjustedLogits[a]! ? 1 : -1
  })
  if (greedy) {
    baseProbs.fill(0)
    baseProbs[order[0]!] = 1
  }
  let mass = 0
  const cumulative = order.map(i => (mass += baseProbs[i]!))
  const statuses: SamplingStatus[] = Array(n).fill('kept')
  const k = Math.max(1, Math.min(n, Math.trunc(config.topK)))
  const afterK = [...baseProbs]
  for (const i of order.slice(k)) {
    afterK[i] = 0
    statuses[i] = 'top-k'
  }
  // All three filters operate on the original temperature-softmax mass; if Top-K
  // leaves less than topP, the whole remaining prefix is kept until final normalization.
  const afterP = [...afterK]
  const nucleus = Math.max(0, Math.min(1, config.topP))
  for (let rank = 1; rank < k; rank++) {
    if (nucleus < 1 && cumulative[rank - 1]! >= nucleus) {
      const i = order[rank]!
      afterP[i] = 0
      statuses[i] = 'top-p'
    }
  }
  const minThreshold = Math.max(0, Math.min(1, config.minP)) * baseProbs[order[0]!]!
  const afterMin = afterP.map((p, i) => {
    if (statuses[i] === 'kept' && p < minThreshold) {
      statuses[i] = 'min-p'
      return 0
    }
    return p
  })
  const survivingMass = afterMin.reduce((sum, p) => sum + p, 0)
  const probabilities = afterMin.map(p => p / survivingMass)
  const entropyBits = shannonEntropy(probabilities)
  return { adjustedLogits, baseProbs, order, cumulative, statuses, minThreshold, probabilities,
    stages: [penaltyProbs, baseProbs, afterK, afterP, afterMin, probabilities],
    survivors: probabilities.filter(p => p > 0).length, entropyBits, perplexity: 2 ** entropyBits, top1: probabilities[order[0]!]! }
}
