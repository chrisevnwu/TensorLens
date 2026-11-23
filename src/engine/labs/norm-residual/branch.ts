import { geluWithDerivative } from '../../math/activations'
import { Matrix } from '../../math/matrix'
import type { SeededRng } from '../../math/prng'

export type Activation = 'relu' | 'gelu' | 'swiglu'

interface BranchFrame {
  out: number[]
  saturated: boolean
  backward: (upstream: readonly number[]) => number[]
}

const branchLimit = 1e12

// x is a row vector; the adjoint projection uses W transpose.
function project(x: readonly number[], weights: Matrix) {
  const result: number[] = Array(weights.cols).fill(0)
  for (let i = 0; i < weights.rows; i++) {
    for (let j = 0; j < weights.cols; j++) {
      result[j] = result[j]! + x[i]! * weights.data[i * weights.cols + j]!
    }
  }
  return result
}

function silu(x: number) {
  const z = Math.exp(-Math.abs(x))
  const sigmoid = x >= 0 ? 1/(1+z) : z/(1+z)
  return { value: x * sigmoid, slope: sigmoid + x * z / (1+z)**2 }
}

export function createBranch(dim: number, rng: SeededRng, weightGain: number, activation: Activation) {
  if (!Number.isSafeInteger(dim) || dim < 1 || !Number.isFinite(weightGain) || weightGain < 0) {
    throw new RangeError('Invalid residual branch dimensions or gain')
  }
  const std = weightGain / Math.sqrt(dim)
  const weights = Matrix.randomNormal(dim, dim, rng, std)
  // Draw both matrices even for unary activations so later layers replay the same samples.
  const gateWeights = Matrix.randomNormal(dim, dim, rng, std)
  return (x: readonly number[]): BranchFrame => {
    if (x.length !== dim) throw new RangeError('Input dimension does not match branch')
    const pre = project(x, weights)
    const gate = activation === 'swiglu' ? project(x, gateWeights) : undefined
    const slopes = Array<number>(dim), gateSlopes = Array<number>(dim).fill(0)
    let saturated = false
    const out = pre.map((a, j) => {
      let value: number
      if (gate) {
        const s = silu(a)
        value = s.value * gate[j]!
        slopes[j] = s.slope * gate[j]!
        gateSlopes[j] = s.value
      } else if (activation === 'gelu') {
        const g = geluWithDerivative(a)
        value = g.value
        slopes[j] = g.slope
      } else {
        value = Math.max(0, a)
        slopes[j] = Number(a > 0)
      }
      // Unnormalized deep multiplicative stacks can overflow Float64. The
      // limiter is part of the forward map, so its saturated derivative is zero.
      if (Math.abs(value) >= branchLimit) {
        saturated = true
        slopes[j] = gateSlopes[j] = 0
        return Math.sign(value) * branchLimit
      }
      return value
    })
    return { out, saturated, backward(upstream) {
      if (upstream.length !== dim) throw new RangeError('Cotangent dimension does not match branch')
      return Array.from({ length: dim }, (_, i) => {
        let grad = 0
        for (let j = 0; j < dim; j++) {
          const index = i*dim+j
          const partial = weights.data[index]! * slopes[j]! + gateWeights.data[index]! * gateSlopes[j]!
          grad += upstream[j]! * partial
        }
        return grad
      })
    } }
  }
}
