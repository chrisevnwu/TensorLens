import { expect, it } from 'vitest'
import { dotProduct } from '../../../math/matrix'
import { normalize } from '../normalization'

it.each(['layernorm','rmsnorm'] as const)('%s reverse derivative agrees with central differences', type => {
  const x = [-1.2, 0.8, 0.3, 2.1], g = [0.3, -0.7, 1.1, 0.8]
  const derivative = normalize(x,type).backward(g)
  x.forEach((_, i) => {
    const loss = (step: number) => dotProduct(g, normalize(x.map((v,j) => v + (i === j ? step : 0)), type).out)
    expect(derivative[i]).toBeCloseTo((loss(1e-5) - loss(-1e-5)) / 2e-5, 7)
  })
  const zero = normalize([0,0,0,0],type)
  expect(zero.out).toEqual([0,0,0,0])
  expect(zero.backward(g).every(Number.isFinite)).toBe(true)
})
it('LayerNorm removes a uniform perturbation while RMSNorm retains mean information', () => {
  const x = [20,1,-2,0], g = [0.5,0.1,-0.4,2]
  expect(normalize(x,'layernorm').backward(g).reduce((a,b) => a+b,0)).toBeCloseTo(0,12)
  expect(normalize(x,'rmsnorm').out.reduce((a,b) => a+b,0)).toBeGreaterThan(0)
})

it('retains the true contraction when a residual branch opposes the identity direction', () => {
  // For y = x - 0.5 RMSNorm(x), an orthogonal probe at (1,-1)
  // has gain 1 - 0.5 / sqrt(1+eps). A universal unit floor would be incorrect.
  const g = [Math.SQRT1_2, Math.SQRT1_2]
  const branch = normalize([1,-1], 'rmsnorm').backward(g)
  const inputGradient = g.map((v,i) => v - 0.5 * branch[i]!)
  expect(Math.hypot(...inputGradient)).toBeCloseTo(0.5, 11)
})
