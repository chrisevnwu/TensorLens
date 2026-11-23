import { Matrix, dotProduct, stableSoftmax } from '../../math/matrix'
import { createRng } from '../../math/prng'
import { dispatch } from './dispatch'

export type BalancingMode = 'none' | 'aux-loss' | 'loss-free-bias'
export interface MoeConfig {
  numTokens: number
  numExperts: number
  topK: number
  capacityFactor: number
  balancingMode: BalancingMode
  auxAlpha: number
  routerNoise: number
}
const domains = ['code', 'math', 'prose', 'logic'] as const
export interface MoeToken {
  id: number
  domain: typeof domains[number]
  features: number[]
}
export interface MoeFrame extends ReturnType<typeof dispatch> {
  step: number
  logits: number[][]
  probs: number[][]
  routerWeights: Matrix
  routerBias: number[]
  selectionBias: number[]
  fullyDroppedTokens: number
  fullyDroppedRate: number
  meanProbs: number[]
  shares: number[]
  loadCV: number
  loadVariance: number
  maxExpertShare: number
  auxLoss: number
  activeRatio: number
}
export interface MoeResult {
  tokens: MoeToken[]
  frames: MoeFrame[]
}

type Distribution = readonly (readonly number[])[]
function expertShares(assigned: readonly number[]) {
  const total = assigned.reduce((a, b) => a + b, 0)
  return assigned.map(count => total ? count / total : 0)
}
function meanProbabilities(probs: Distribution, experts: number) {
  const means: number[] = Array(experts).fill(0)
  for (const row of probs) row.forEach((p, e) => { means[e] = means[e]! + p / probs.length })
  return means
}
export function auxiliaryLoss(probs: Distribution, assigned: readonly number[], alpha: number) {
  return alpha * assigned.length * dotProduct(expertShares(assigned), meanProbabilities(probs, assigned.length))
}

/** Differentiate α E Σ_e f_e P_e with the discrete assignment fractions f held fixed. */
export function auxGradient(probs: Distribution, assigned: readonly number[], alpha: number) {
  const shares = expertShares(assigned)
  const factor = alpha * assigned.length / probs.length
  return probs.map(row => {
    const meanShare = dotProduct(shares, row)
    return row.map((p, e) => factor * p * (shares[e]! - meanShare))
  })
}

export function simulateMoe(config: MoeConfig, seed = 42): MoeResult {
  const { numExperts: E, numTokens: T, topK: K, balancingMode } = config
  if (!Number.isSafeInteger(T) || T <= 0 || !Number.isSafeInteger(E) || E <= 0) throw new RangeError('Invalid router dimensions')
  const rng = createRng(seed)
  const tokens: MoeToken[] = Array.from({ length: T }, (_, id) => {
    const domain = id % domains.length
    const features = Array.from({ length: 8 }, (_, k) => (k === domain ? 1 : 0) + rng.nextGaussian(0, k < 4 ? .12 : .5))
    return { id, domain: domains[domain]!, features }
  })
  const X = Matrix.from2D(tokens.map(token => token.features))
  const Xt = X.transpose()
  let weights = Matrix.randomNormal(8, E, rng, .23)
  let routerBias = Array.from({ length: E }, (_, e) => .3 / (e + 1))
  let selectionBias: number[] = Array(E).fill(0)
  // Fix jitter for this seeded token batch so changing policy changes only its routing updates.
  const noise = Matrix.randomNormal(T, E, rng, config.routerNoise)
  const frames: MoeFrame[] = []
  for (let step = 0; step <= 30; step++) {
    const logits = X.matmul(weights).map((v, t, e) => v + routerBias[e]! + noise.get(t, e)).to2D()
    const probs = logits.map(row => stableSoftmax(row))
    const routed = dispatch(probs, K, config.capacityFactor, balancingMode === 'loss-free-bias' ? selectionBias : undefined)
    const shares = expertShares(routed.assigned)
    const meanProbs = meanProbabilities(probs, E)
    const meanLoad = T * K / E
    const loadVariance = routed.assigned.reduce((sum, count) => sum + (count - meanLoad) ** 2 / E, 0)
    const acceptedTokens = new Set(routed.routes.filter(route => !route.dropped).map(route => route.token))
    const fullyDroppedTokens = T - acceptedTokens.size
    frames.push({ ...routed, step, probs, logits, routerWeights: weights, routerBias, selectionBias, shares, meanProbs,
      loadVariance, loadCV: Math.sqrt(loadVariance) / meanLoad, maxExpertShare: Math.max(...shares),
      auxLoss: config.auxAlpha * E * dotProduct(shares, meanProbs), activeRatio: K / E,
      fullyDroppedTokens, fullyDroppedRate: fullyDroppedTokens / T })
    if (step === 30) break
    if (balancingMode === 'loss-free-bias') {
      // Bias affects Top-K assignment only. Expert combination still uses the original softmax.
      selectionBias = selectionBias.map((b, e) => b + .012 * Math.sign(T * K / E - routed.assigned[e]!))
    } else {
      // The unbalanced policy rewards probability mass on popular experts. The balanced
      // policy minimizes the actual Switch loss with the same batch and linear router.
      const coefficient = balancingMode === 'none' ? -.045 : config.auxAlpha
      const dLogits = auxGradient(probs, routed.assigned, coefficient)
      const learningRate = 8
      weights = weights.sub(Xt.matmul(Matrix.from2D(dLogits)).scale(learningRate))
      routerBias = routerBias.map((b, e) => b - learningRate * dLogits.reduce((sum, row) => sum + row[e]!, 0))
    }
  }
  return { tokens, frames }
}
