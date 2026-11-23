import { dotProduct, logSumExp, stableSoftmax } from '../../math/matrix'

type Batch = readonly (readonly number[])[]

function unit(vector: readonly number[], width: number) {
  if (!width || vector.length !== width || !vector.every(Number.isFinite))
    throw new RangeError('Expected finite vectors of equal, nonzero width')
  const scale = vector.reduce((largest, x) => Math.max(largest, Math.abs(x)), 0)
  if (scale === 0) throw new RangeError('Cosine is undefined for zero vectors')
  const scaled = vector.map(x => x / scale)
  const norm = Math.sqrt(dotProduct(scaled, scaled))
  return scaled.map(x => x / norm)
}

function scoreDirection(cosines: number[][], temperature: number) {
  const probabilities = cosines.map(row => stableSoftmax(row, temperature))
  let loss = 0
  let hits = 0
  cosines.forEach((row, i) => {
    // Subtract the positive logit before logsumexp to retain small losses.
    loss += logSumExp(row.map(x => (x - row[i]!) / temperature))
    if (row.indexOf(Math.max(...row)) === i) hits++
  })
  return { probabilities, loss: loss / cosines.length, hits }
}

/** The diagonal supplies the positive pair labels. byCaption[j][i] is P(image i | caption j). */
export function contrastiveBatch(images: Batch, captions: Batch, temperature: number) {
  if (!images.length || images.length !== captions.length || !Number.isFinite(temperature) || temperature <= 0)
    throw new RangeError('Expected equal nonempty batches and a finite positive temperature')
  const width = images[0]!.length
  const imageUnits = images.map(x => unit(x, width))
  const captionUnits = captions.map(x => unit(x, width))
  const cosines = imageUnits.map(image => captionUnits.map(caption => Math.max(-1, Math.min(1, dotProduct(image, caption)))))
  const image = scoreDirection(cosines, temperature)
  const caption = scoreDirection(captions.map((_, j) => cosines.map(row => row[j]!)), temperature)
  return {
    cosines, byImage: image.probabilities, byCaption: caption.probabilities,
    imageLoss: image.loss, captionLoss: caption.loss, loss: (image.loss + caption.loss) / 2,
    imageHits: image.hits, captionHits: caption.hits,
  }
}

export const arrangements = ['matched', 'swapped', 'reordered'] as const
export type Arrangement = typeof arrangements[number]
export const sampleIds = ['circle', 'duo', 'triangle'] as const
export type SampleId = typeof sampleIds[number]

// Each vector explicitly records [circle, triangle, count = one, count = two].
const features: Record<SampleId, readonly number[]> = {
  circle: [1, 0, 1, 0], duo: [1, 0, 0, 1], triangle: [0, 1, 1, 0],
}

export function runExperiment(order: Arrangement, temperature: number, broad: boolean) {
  const images: readonly SampleId[] = order === 'reordered' ? ['triangle', 'circle', 'duo'] : sampleIds
  const captions: readonly SampleId[] = order === 'swapped' ? ['duo', 'circle', 'triangle'] : images
  const imageFeatures = images.map(id => features[id])
  const captionFeatures = captions.map(id => id === 'duo' && broad ? [1, 0, 0, 0] : features[id])
  return { images, captions, imageFeatures, captionFeatures, ...contrastiveBatch(imageFeatures, captionFeatures, temperature) }
}

export type Experiment = ReturnType<typeof runExperiment>
