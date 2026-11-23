import { expect, it } from 'vitest'
import { createRng } from '../../../math/prng'
import { createBranch, type Activation } from '../branch'

const modes: Activation[] = ['relu', 'gelu', 'swiglu']

it.each(modes)('agrees with independent central finite differences on every channel for %s', mode => {
  for (const dimension of [3, 8, 32]) {
    const rng = createRng(307)
    const branch = createBranch(dimension, createRng(401), 1.3, mode)
    const x = Array.from({ length: dimension }, () => rng.nextGaussian())
    const g = Array.from({ length: dimension }, () => rng.nextGaussian())
    const { out, backward, saturated } = branch(x)
    expect(out).toHaveLength(dimension)
    expect(saturated).toBe(false)
    const grad = backward(g)
    const probe = (input: number[]) => branch(input).out.reduce((s,y,i) => s + y*g[i]!, 0)
    for (let i=0; i<dimension; i++) {
      const hi = [...x], lo = [...x], h=1e-5
      hi[i] = x[i]! + h
      lo[i] = x[i]! - h
      expect(Math.abs(grad[i]! - (probe(hi) - probe(lo)) / (2*h))).toBeLessThan(1e-6)
    }
  }
})

it('uses the specified Gaussian scale and row-vector projection convention', () => {
  const dim = 3, gain = 1.5, rng = createRng(28)
  const w = Array.from({length:dim*dim}, () => rng.nextGaussian(0,gain/Math.sqrt(dim)))
  const x = [1,-2,0.5]
  const result = createBranch(dim,createRng(28),gain,'relu')(x).out
  for (let j=0; j<dim; j++) {
    const z = x.reduce((sum,value,i) => sum + value*w[i*dim+j]!,0)
    expect(result[j]).toBeCloseTo(Math.max(0,z),12)
  }
})

it('uses a separate linear gate in SwiGLU and the derivative through both projected paths', () => {
  const rng = createRng(43)
  const w1 = rng.nextGaussian(0,1)
  const w3 = rng.nextGaussian(0,1)
  const x = 1.2, a = x*w1, b = x*w3
  const sigmoid = 1/(1+Math.exp(-a))
  const expected = (sigmoid + a * sigmoid * (1-sigmoid))*w1*b + a*sigmoid*w3
  const frame = createBranch(1,createRng(43),1,'swiglu')([x])
  expect(frame.out[0]).toBeCloseTo(a*sigmoid*b,12)
  expect(frame.backward([1])[0]).toBeCloseTo(expected,12)
})

it.each(modes)('replays seeded projections, computes a finite zero-input Jacobian, and rejects inconsistent dimensions (%s)', mode => {
  const build = () => createBranch(4, createRng(0), 1.1, mode)
  const first = build()([0,0,0,0]), second = build()([0,0,0,0])
  expect(first.out).toEqual(second.out)
  expect(first.out.every(x => x === 0)).toBe(true)
  expect(first.backward([1,0,0,0]).every(Number.isFinite)).toBe(true)
  expect(() => build()([1])).toThrow(RangeError)
  expect(() => first.backward([1])).toThrow(RangeError)
})

it('reports the safety saturation and gives the correct zero local slope when clipped', () => {
  const frame = createBranch(1,createRng(748),1,'swiglu')([1e20])
  const opposite = createBranch(1,createRng(748),1,'swiglu')([-1e20])
  const clipped = frame.saturated ? frame : opposite
  expect(clipped.saturated).toBe(true)
  expect(Math.abs(clipped.out[0]!)).toBe(1e12)
  expect(clipped.backward([1])[0]).toBe(0)
})
