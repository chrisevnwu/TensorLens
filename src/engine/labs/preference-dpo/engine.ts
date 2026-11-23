/** log(1+exp(x)) without forming a large exponential. */
function softplus(x: number) {
  return Math.max(x, 0) + Math.log1p(Math.exp(-Math.abs(x)))
}

export function evaluatePolicy(logOdds: number, referenceLogOdds: number, beta: number, voteShareA: number) {
  const logA = -softplus(-logOdds)
  const logB = -softplus(logOdds)
  const probabilityA = Math.exp(logA)
  const probabilityB = Math.exp(logB)
  const margin = beta * (logOdds - referenceLogOdds)
  const predictedVoteA = Math.exp(-softplus(-margin))
  const lossIfA = softplus(-margin)
  const lossIfB = softplus(margin)
  const loss = voteShareA * lossIfA + (1 - voteShareA) * lossIfB
  const gradient = beta * (predictedVoteA - voteShareA)
  const kl = probabilityA * (logA + softplus(-referenceLogOdds))
    + probabilityB * (logB + softplus(referenceLogOdds))
  return { logOdds, margin, probabilityA, probabilityB, predictedVoteA, lossIfA, lossIfB, loss, gradient, kl: Math.max(0, kl) }
}

export const VOTES = 20
export const UPDATES = 60

export interface DpoConfig {
  votesA: number
  referencePercentA: number
  beta: number
  rate: number
}

export function trainPreferences({ votesA, referencePercentA, beta, rate }: DpoConfig) {
  if (!Number.isInteger(votesA) || votesA < 0 || votesA > VOTES
    || !(referencePercentA > 0 && referencePercentA < 100)
    || !(beta >= .1 && beta <= 2) || !(rate >= .05 && rate <= 1)) {
    throw new RangeError('Invalid two-completion DPO configuration')
  }
  const referenceLogOdds = Math.log(referencePercentA / (100 - referencePercentA))
  const voteShareA = votesA / VOTES
  let theta = referenceLogOdds
  const trace = []
  for (let step = 0; step <= UPDATES; step++) {
    const frame = evaluatePolicy(theta, referenceLogOdds, beta, voteShareA)
    trace.push(frame)
    theta -= rate * frame.gradient
  }
  return trace
}
