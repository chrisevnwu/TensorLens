import { dotProduct, layerNormVector, rmsNormVector } from '../../math/matrix'

export type NormType = 'layernorm' | 'rmsnorm'
const epsilon = 1e-12

/** The reverse pass applies the transpose Jacobian of the same stabilized forward map. */
export function normalize(x: readonly number[], type: NormType) {
  const norm = type === 'layernorm' ? layerNormVector(x, epsilon) : rmsNormVector(x, epsilon)
  const out = norm.out
  const scale = 'rms' in norm ? Math.hypot(norm.rms, Math.sqrt(epsilon)) : Math.sqrt(norm.variance + epsilon)
  return {
    out,
    backward(g: readonly number[]) {
      if (x.length !== g.length) throw new RangeError('Gradient width must match the normalized vector')
      if (!g.length) return []
      const mean = type === 'layernorm' ? g.reduce((sum, v) => sum + v, 0) / g.length : 0
      const projection = dotProduct(g, out) / g.length
      return g.map((v, i) => (v - mean - out[i]! * projection) / scale)
    },
  }
}
