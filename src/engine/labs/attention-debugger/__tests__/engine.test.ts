import { expect, it } from 'vitest'
import { parseTokens, simulateAttention } from '../engine'
import { ATTENTION_PRESETS } from '../presets'

const standard = ATTENTION_PRESETS[0]

it('parses custom comma/whitespace-separated Unicode tokens up to the eight-token limit', () => {
  expect(parseTokens('猫,  sat\ton\r\n the mat')).toEqual(['猫','sat','on','the','mat'])
  expect(parseTokens('1 2 3 4 5 6 7 8 9')).toHaveLength(8)
  expect(parseTokens(' , \t')).toEqual([])
})

it.each(['causal','bidirectional','sliding'] as const)('normalizes every row, exactly masks forbidden keys, and calculates entropy and density (%s)', maskType => {
  for (const nHeads of [1, 2, 4]) {
    for (const windowSize of [2, 3, 5]) {
      const result = simulateAttention({ ...standard, numHeads: nHeads, maskType, windowSize, logitScale: 4 })
      const n = result.tokens.length
      for (const head of result.heads) {
        let entropy = 0, visible = 0, peak = 0
        for (let i = 0; i < n; i++) {
          let total = 0
          for (let j = 0; j < n; j++) {
            const allowed = maskType === 'bidirectional' || (j <= i && (maskType !== 'sliding' || i-j < windowSize))
            const weight = head.weights.get(i,j)
            expect(Number.isFinite(weight)).toBe(true)
            expect(weight).toBeGreaterThanOrEqual(0)
            expect(weight).toBeLessThanOrEqual(1)
            total += weight
            if (!allowed) {
              expect(weight).toBe(0)
              expect(head.masked.get(i,j)).toBe(-Infinity)
            } else {
              visible++
              expect(head.masked.get(i,j)).toBe(head.scaled.get(i,j))
            }
            if (weight > 0) entropy -= weight * Math.log(weight)
            peak = Math.max(peak, weight)
          }
          expect(Math.abs(total - 1)).toBeLessThan(1e-10)
        }
        expect(head.meanEntropy).toBeCloseTo(entropy / n, 10)
        expect(head.peak).toBeCloseTo(peak, 12)
        expect(head.maskDensity).toBeCloseTo(visible / (n*n), 12)
        expect(Array.from(head.output.data).every(Number.isFinite)).toBe(true)
      }
    }
  }
})

it.each([1,2,4])('projects seeded embeddings, computes scaled QK products, and contracts AV for %i heads', numHeads => {
  const config = { ...standard, logitScale: 2, numHeads }
  const result = simulateAttention(config)
  const n = result.tokens.length, d = 12 / numHeads
  expect(result.X.rows).toBe(n)
  expect(result.X.cols).toBe(12)
  expect(result.heads.length).toBe(numHeads)
  for (const head of result.heads) {
    for (const [actual, projection] of [[head.Q,head.Wq], [head.K,head.Wk], [head.V,head.Wv]] as const) {
      expect(actual.to2D()).toEqual(result.X.matmul(projection).to2D())
    }
    for (let i=0; i<n; i++) {
      for (let j=0; j<n; j++) {
        let sum = 0
        for (let z=0; z<d; z++) sum += head.Q.get(i,z) * head.K.get(j,z) * config.logitScale ** 2
        expect(head.raw.get(i,j)).toBeCloseTo(sum, 11)
        expect(head.scaled.get(i,j)).toBeCloseTo(sum / Math.sqrt(d), 11)
      }
      for (let z=0; z<d; z++) {
        let value = 0
        for (let j=0; j<n; j++) value += head.weights.get(i,j) * head.V.get(j,z)
        expect(head.output.get(i,z)).toBeCloseTo(value, 11)
      }
    }
  }
  expect(result.output.to2D()).toEqual(result.concat.matmul(result.Wo).to2D())
})

it.each([2, 3, 4])('reduces mean entropy by removing square-root scaling at gain %i', logitScale => {
  const config = { ...standard, logitScale }
  const scaled = simulateAttention(config)
  const raw = simulateAttention({ ...config, useScaling: false })
  raw.heads.forEach((head, h) => {
    expect(head.meanEntropy).toBeLessThanOrEqual(scaled.heads[h]!.meanEntropy + 1e-12)
    expect(head.scaled.to2D()).toEqual(head.raw.to2D())
  })
})

it.each(['MHA','GQA','MQA'] as const)('uses identical K and V projections for heads in the same physical KV group (%s)', topology => {
  const result = simulateAttention({ ...standard, topology })
  result.heads.forEach((head,i) => result.heads.forEach((other,j) => {
    if (result.topology.links[i] === result.topology.links[j]) {
      expect(head.Wk.to2D()).toEqual(other.Wk.to2D())
      expect(head.Wv.to2D()).toEqual(other.Wv.to2D())
      expect(head.K.to2D()).toEqual(other.K.to2D())
      expect(head.V.to2D()).toEqual(other.V.to2D())
    }
  }))
})

it('saturates on the high-gain preset and produces bit-identical seeded outputs', () => {
  const config = ATTENTION_PRESETS[2]
  const result = simulateAttention(config)
  expect(result.heads[0]!.meanEntropy).toBeLessThan(0.35)
  expect(result).toEqual(simulateAttention(config))
  expect(simulateAttention(config, 123).X.to2D()).not.toEqual(result.X.to2D())
})

it('keeps a single-token head finite with unit self-attention and zero entropy', () => {
  for (const maskType of ['causal','bidirectional','sliding'] as const) {
    const result = simulateAttention({ ...standard, tokens: ['猫'], useScaling: false, logitScale: 4, maskType })
    for (const head of result.heads) {
      expect(head.weights.to2D()).toEqual([[1]])
      expect(Math.abs(head.meanEntropy)).toBe(0)
      expect(head.output.to2D()).toEqual(head.V.to2D())
    }
  }
})
it('retains shape and finite metrics for an empty custom prompt', () => {
  const result = simulateAttention({ ...standard, tokens: [] })
  expect(result.output.rows).toBe(0)
  expect(result.output.cols).toBe(12)
  for (const head of result.heads) expect([head.meanEntropy,head.peak,head.maskDensity].every(Number.isFinite)).toBe(true)
})
