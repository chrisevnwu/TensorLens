import { expect, it } from 'vitest'
import { createRng } from '../prng'

it('replays a Mulberry32 stream, Gaussian samples and Fisher–Yates permutations', () => {
  const a = createRng(1)
  const b = createRng(1)
  expect(a.next()).toBe(0.6270739405881613)
  b.next()
  const cards = Object.freeze([1, 2, 3, 4, 5, 6])
  const seen = new Set<number>()
  for (let i = 0; i < 1000; i++) {
    const u = a.next()
    expect(u).toBe(b.next())
    expect(u).toBeGreaterThanOrEqual(0)
    expect(u).toBeLessThan(1)
    expect(a.nextGaussian(3, 2)).toBe(b.nextGaussian(3, 2))
    const n = a.nextInt(-1, 1)
    expect(n).toBe(b.nextInt(-1, 1))
    seen.add(n)
  }
  expect([...seen].sort()).toEqual([-1, 0, 1])
  const shuffled = a.shuffle(cards)
  expect(shuffled).toEqual(b.shuffle(cards))
  expect([...shuffled].sort()).toEqual(cards)
  expect(createRng(2).next()).not.toBe(createRng(1).next())
})
