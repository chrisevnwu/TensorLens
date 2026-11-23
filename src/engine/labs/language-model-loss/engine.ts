import { logSumExp, stableSoftmax } from '../../math/matrix'

export function scoreToken(logits: readonly number[], target: number) {
  if (!Number.isInteger(target) || target < 0 || target >= logits.length || !logits.every(Number.isFinite)) {
    throw new RangeError('Expected finite logits and a target in the vocabulary')
  }
  const maximum = Math.max(...logits)
  const shifted = logits.map(value => value - maximum)
  return {
    probabilities: stableSoftmax(shifted),
    predicted: logits.indexOf(maximum),
    loss: logSumExp(shifted) - shifted[target]!,
  }
}

export const NOTES = ['C', 'D', 'E', 'G'] as const
const sequence = [0, 1, 2, 3, 0, 1, 2, 0] as const
export const POSITIONS = sequence.length - 1
export const ALL_POSITIONS = 2 ** POSITIONS - 1

/** A fixed one-step transition model. The observed previous note conditions each prediction. */
export function evaluateSequence(gap: number, mask = ALL_POSITIONS) {
  if (!Number.isFinite(gap) || gap < 0 || gap > 8 || !Number.isInteger(mask) || mask < 0 || mask > ALL_POSITIONS) {
    throw new RangeError('Expected a logit gap from 0 to 8 and a valid sequence mask')
  }
  const rows = sequence.slice(1).map((target, i) => {
    const previous = sequence[i]!
    const logits = NOTES.map((_, note) => note === (previous + 1) % NOTES.length ? gap : 0)
    return { previous, target, logits, included: Boolean(mask & (1 << i)), ...scoreToken(logits, target) }
  })
  const scored = rows.filter(row => row.included)
  const count = scored.length
  const totalLoss = scored.reduce((sum, row) => sum + row.loss, 0)
  const meanLoss = count ? totalLoss / count : null
  const correct = scored.filter(row => row.target === row.predicted).length
  return { rows, count, correct, totalLoss, meanLoss, accuracy: count ? correct / count : null,
    perplexity: meanLoss === null ? null : Math.exp(meanLoss) }
}
