import { createRng } from '../../math/prng'

export interface MonteCarloState {
  seed: number
  cursor: number
  distribution: number[]
  counts: number[]
  frequencies: number[]
  lastIndex: number | null
  lastDraw: number | null
}

/** One PRNG draw per token. A URL can reconstruct the entire run from seed and cursor. */
export function sampleMonteCarlo(
  probabilities: readonly number[],
  draws: number,
  seed = 42,
  previous?: MonteCarloState,
): MonteCarloState {
  if (!Number.isSafeInteger(draws) || draws < 0 || !Number.isSafeInteger(seed)) {
    throw new RangeError('Expected an integer seed and nonnegative integer draw count')
  }
  if (!probabilities.length || probabilities.some(p => !Number.isFinite(p) || p < 0)) {
    throw new RangeError('Expected nonnegative finite probabilities')
  }
  const largest = Math.max(...probabilities)
  if (largest === 0) throw new RangeError('At least one token must survive')
  // Scale before summing so the categorical sampler also accepts finite unnormalized weights.
  const weights = probabilities.map(p => p / largest)
  const total = weights.reduce((sum, weight) => sum + weight, 0)
  const distribution = weights.map(weight => weight / total)
  const cursor = previous?.cursor ?? 0
  if (previous && (previous.seed !== seed || previous.distribution.length !== distribution.length
      || previous.distribution.some((p, i) => p !== distribution[i])
      || previous.counts.length !== distribution.length || previous.counts.some(n => !Number.isSafeInteger(n) || n < 0)
      || previous.counts.reduce((sum,n) => sum+n,0) !== cursor)) {
    throw new RangeError('Checkpoint does not match this sampling run')
  }
  if (!Number.isSafeInteger(cursor + draws)) throw new RangeError('Sample count exceeds integer precision')

  // Exclude masked tokens before constructing the CDF. A uniform draw of zero
  // then selects the first positive interval even if several tokens were removed.
  const cdf: number[] = [], indices: number[] = []
  let cumulative = 0
  weights.forEach((weight, index) => {
    if (!weight) return
    cumulative += weight
    indices.push(index)
    cdf.push(cumulative / total)
  })
  const rng = createRng(seed)
  for (let i = 0; i < cursor; i++) rng.next()
  const counts = previous ? [...previous.counts] : Array<number>(distribution.length).fill(0)
  let lastIndex = previous?.lastIndex ?? null
  let lastDraw = previous?.lastDraw ?? null
  for (let i = 0; i < draws; i++) {
    lastDraw = rng.next()
    let left = 0, right = cdf.length - 1
    while (left < right) {
      const mid = left + Math.floor((right - left) / 2)
      if (lastDraw < cdf[mid]!) right = mid
      else left = mid + 1
    }
    lastIndex = indices[left]!
    counts[lastIndex] = counts[lastIndex]! + 1
  }
  const n = cursor + draws
  return {seed,cursor:n,distribution,counts,frequencies:counts.map(k => n ? k / n : 0),lastIndex,lastDraw}
}
