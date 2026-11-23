export type AttentionTopology = 'MHA' | 'GQA' | 'MQA'

export function buildTopology(numHeads: number, topology: AttentionTopology, modelDim = 12) {
  if (!Number.isSafeInteger(numHeads) || numHeads <= 0 || !Number.isSafeInteger(modelDim)
      || modelDim <= 0 || modelDim % numHeads !== 0) {
    throw new RangeError('Embedding width must be divisible by the number of query heads')
  }
  let numKvHeads = numHeads
  if (topology === 'MQA') numKvHeads = 1
  if (topology === 'GQA') numKvHeads = Math.min(2, numHeads)
  if (numHeads % numKvHeads !== 0) throw new RangeError('KV groups must have equal size')
  const headDim = modelDim / numHeads
  const sharingRatio = numHeads / numKvHeads
  return {
    numKvHeads, headDim, sharingRatio,
    kvParameters: 2 * modelDim * headDim * numKvHeads,
    links: Array.from({ length: numHeads }, (_, head) => Math.floor(head / sharingRatio)),
  }
}
