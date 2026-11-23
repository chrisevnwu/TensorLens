import { createRng } from '../../math/prng'

function isDistribution(weights: readonly number[]) {
  return weights.length > 0 && weights.every(n => Number.isFinite(n) && n >= 0)
    && Math.abs(weights.reduce((sum, n) => sum + n, 0) - 1) < 1e-12
}

export function oneStepLaw(target: readonly number[], draft: readonly number[]) {
  if (target.length !== draft.length || !isDistribution(target) || !isDistribution(draft)) {
    throw new RangeError('Expected equally sized categorical distributions')
  }
  const acceptedMass = target.map((p, i) => Math.min(p, draft[i]!))
  const deficits = target.map((p, i) => Math.max(0, p - draft[i]!))
  const rejection = deficits.reduce((sum, n) => sum + n, 0)
  const acceptance = acceptedMass.reduce((sum, n) => sum + n, 0)
  const residual = deficits.map(n => rejection ? n / rejection : 0)
  const output = acceptedMass.map((p, i) => p + rejection * residual[i]!)
  return { target, draft, acceptedMass, acceptance, rejection, residual, output }
}

export const TOKENS = ['A', 'B', 'C'] as const
export type Token = typeof TOKENS[number]
export const OUTPUT_LENGTH = 16

export interface SpecConfig {
  mismatch: number
  blockSize: number
  seed: number
}

export function distributions(context: Token, mismatch: number) {
  const previous = TOKENS.indexOf(context)
  const row = [.1, .7, .2]
  const target = TOKENS.map((_, i) => row[(i - previous + 3) % 3]!)
  const fraction = mismatch / 100
  const draft = target.map((p, i) => (1 - fraction) * p + (i === previous ? fraction : 0))
  return { target, draft }
}

export interface Proposal {
  context: Token
  token: Token
  threshold: number
  draw: number | null
  status: 'accepted' | 'rejected' | 'discarded'
}

export interface Block {
  proposals: Proposal[]
  tailKind: 'correction' | 'bonus' | 'direct'
  tailContext: Token
  tailToken: Token
  output: Token[]
  accepted: number
  tested: number
  discarded: number
}

function sample(weights: readonly number[], draw: number): Token {
  let cumulative = 0
  for (const [i, weight] of weights.entries()) {
    cumulative += weight
    if (draw < cumulative) return TOKENS[i]!
  }
  // Rounding a normalized distribution can leave the sum just below one.
  return TOKENS[weights.map(weight => weight > 0).lastIndexOf(true)]!
}

export function runSpeculation({ mismatch, blockSize, seed }: SpecConfig): Block[] {
  if (!Number.isFinite(mismatch) || mismatch < 0 || mismatch > 100
    || !Number.isInteger(blockSize) || blockSize < 1 || blockSize > 4 || !Number.isSafeInteger(seed)) {
    throw new RangeError('Invalid speculative decoding configuration')
  }
  const rng = createRng(seed)
  const blocks: Block[] = []
  const output: Token[] = []
  let accepted = 0, tested = 0, discarded = 0
  while (output.length < OUTPUT_LENGTH) {
    const proposals: Proposal[] = []
    let context = output.at(-1) ?? 'A'
    // Leave space for the correction or bonus, including a direct final token.
    const count = Math.min(blockSize, OUTPUT_LENGTH - output.length - 1)
    for (let i = 0; i < count; i++) {
      const { target, draft } = distributions(context, mismatch)
      const token = sample(draft, rng.next())
      const index = TOKENS.indexOf(token)
      const threshold = Math.min(1, target[index]! / draft[index]!)
      proposals.push({ context, token, threshold, draw: null, status: 'discarded' })
      context = token
    }

    let tailKind: Block['tailKind'] = count ? 'bonus' : 'direct'
    for (const proposal of proposals) {
      tested++
      proposal.draw = rng.next()
      if (proposal.draw >= proposal.threshold) {
        proposal.status = 'rejected'
        tailKind = 'correction'
        break
      }
      proposal.status = 'accepted'
      accepted++
      output.push(proposal.token)
    }

    discarded += proposals.filter(p => p.status === 'discarded').length
    const tailContext = output.at(-1) ?? 'A'
    const { target, draft } = distributions(tailContext, mismatch)
    const weights = tailKind === 'correction' ? oneStepLaw(target, draft).residual : target
    const tailToken = sample(weights, rng.next())
    output.push(tailToken)
    blocks.push({ proposals, tailKind, tailContext, tailToken, output: [...output], accepted, tested, discarded })
  }
  return blocks
}
