import { cosineSimilarity, layerNormVector, rmsNormVector } from '../../math/matrix'
import { createRng } from '../../math/prng'
import { createBranch, type Activation } from './branch'
import { normalize, type NormType } from './normalization'

export const WIDTH = 32
export type Placement = 'pre-norm' | 'post-norm' | 'none'
export interface ResidualConfig {
  numLayers: number
  placement: Placement
  normType: NormType
  useResidual: boolean
  activation: Activation
  weightGain: number
  outlierMag: number
}

export interface LayerFrame {
  layer: number
  x: number[]
  gradient: number[]
  layerNorm: number[]
  rmsNorm: number[]
  norm: number
  mean: number
  std: number
  min: number
  max: number
  maxAbs: number
  cosine: number
  gradNorm: number
  saturated: boolean
}

export interface ResidualResult {
  trace: LayerFrame[]
  normRatio: number
  gradRatio: number
  finalNorm: number
  signalCosine: number
  layerNormFlops: number
  rmsNormFlops: number
  flopsSaved: number
}

function describe(x: number[], input: number[], layer: number, saturated: boolean): LayerFrame {
  const centered = layerNormVector(x)
  const min = Math.min(...x), max = Math.max(...x)
  return {
    x, layer, saturated, norm: Math.hypot(...x), mean: centered.mean, std: Math.sqrt(centered.variance), min, max,
    maxAbs: Math.max(-min, max), cosine: cosineSimilarity(input, x), layerNorm: centered.out,
    rmsNorm: rmsNormVector(x).out, gradient: [], gradNorm: 0,
  }
}

export function simulateResidual(
  config: ResidualConfig, seed = 42, input?: readonly number[], terminalCotangent?: readonly number[],
): ResidualResult {
  if (terminalCotangent && (terminalCotangent.length !== WIDTH || !terminalCotangent.every(Number.isFinite))) {
    throw new RangeError('Expected 32 finite terminal gradient values')
  }
  if (input && input.length !== WIDTH) throw new RangeError('The residual stream has 32 channels')
  if (!Number.isInteger(config.numLayers) || config.numLayers < 4 || config.numLayers > 32) throw new RangeError('Expected 4 to 32 layers')
  const inputRng = createRng(seed ^ 0x5f27bc)
  const weightRng = createRng(seed)
  const start = input ? [...input] : Array.from({ length: WIDTH }, () => inputRng.nextGaussian())
  start[0] = start[0]! + config.outlierMag
  const trace = [describe(start, start, 0, false)]
  const backward: Array<(g: readonly number[]) => number[]> = []
  let x = start
  for (let l = 0; l < config.numLayers; l++) {
    const pre = config.placement === 'pre-norm' ? normalize(x, config.normType) : undefined
    const branch = createBranch(WIDTH, weightRng, config.weightGain, config.activation)(pre?.out ?? x)
    const mixed = config.useResidual ? branch.out.map((v, i) => v + x[i]!) : branch.out
    const post = config.placement === 'post-norm' ? normalize(mixed, config.normType) : undefined
    x = post?.out ?? mixed
    trace.push(describe(x, start, l + 1, branch.saturated))
    backward.push(g => {
      const mixedGradient = post?.backward(g) ?? g
      const branchGradient = branch.backward(mixedGradient)
      const dx = pre?.backward(branchGradient) ?? branchGradient
      return config.useResidual ? dx.map((v, i) => v + mixedGradient[i]!) : dx
    })
  }
  // Default loss L = x_final[0]. A supplied probe v instead differentiates vᵀ x_final.
  // Choosing v = ones/sqrt(d) isolates the translation symmetry of pre-LayerNorm skips.
  let gradient = terminalCotangent ? [...terminalCotangent] : Array.from({ length: WIDTH }, (_, i) => Number(i === 0))
  for (let l = config.numLayers; l >= 0; l--) {
    const frame = trace[l]!
    frame.gradient = gradient
    frame.gradNorm = Math.hypot(...gradient)
    if (l > 0) gradient = backward[l - 1]!(gradient)
  }
  const first = trace[0]!, last = trace[config.numLayers]!
  // Count scalar add/subtract/multiply/divide/sqrt as one operation. Without affine
  // parameters, LayerNorm adds a mean reduction and d centering subtractions to RMSNorm.
  const rmsNormFlops = 3 * WIDTH + 2, layerNormFlops = 5 * WIDTH + 2
  return { trace, gradRatio: last.gradNorm ? first.gradNorm / last.gradNorm : 0, normRatio: last.norm / Math.max(first.norm, 1e-12),
    finalNorm: last.norm, signalCosine: last.cosine, layerNormFlops, rmsNormFlops, flopsSaved: layerNormFlops - rmsNormFlops }
}
