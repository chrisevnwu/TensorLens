import { describe, expect, it } from 'vitest'
import { distributions, oneStepLaw, runSpeculation, OUTPUT_LENGTH, TOKENS, type Token } from '../engine'

describe('speculative acceptance and correction', () => {
  it('recovers target-only tokens from the rejection branch', () => {
    const law = oneStepLaw([.1, .7, .2], [1, 0, 0])
    expect(law.acceptedMass).toEqual([.1, 0, 0])
    expect(law.acceptance).toBeCloseTo(.1)
    expect(law.residual[1]).toBeCloseTo(7 / 9)
    expect(law.residual[2]).toBeCloseTo(2 / 9)
    for (const [i, expected] of [.1, .7, .2].entries()) expect(law.output[i]).toBeCloseTo(expected, 13)
  })
})


describe('block verification', () => {
  it('emits three accepted tokens and a target bonus per call for a matching draft', () => {
    const blocks = runSpeculation({ blockSize: 3, mismatch: 0, seed: 12 })
    expect(blocks).toHaveLength(4)
    for (const block of blocks) {
      expect(block.proposals).toHaveLength(3)
      expect(block.proposals.every(item => item.status === 'accepted')).toBe(true)
      expect(block.tailKind).toBe('bonus')
    }
    expect(blocks.at(-1)!.output).toHaveLength(OUTPUT_LENGTH)
  })
  it('rotates the same categorical law to the previous emitted token', () => {
    expect(distributions('B', 100)).toEqual({ target: [.2, .1, .7], draft: [0, 1, 0] })
    expect(distributions('C', 0).draft).toEqual([.7, .2, .1])
    const law = oneStepLaw([0, 1], [1, 0])
    expect(law.residual).toEqual([0, 1])
    expect(oneStepLaw([.4,.6], [.4,.6]).residual).toEqual([0,0])
    expect(() => oneStepLaw([.5, .6], [1,0])).toThrow()
  })
  it('replays a seed, accounts for every token and discards the suffix after rejection', () => {
    for (const mismatch of [0, 25, 50, 100]) {
      for (const blockSize of [1, 2, 3, 4]) {
        for (const seed of [1, 7, 19, 55, 100]) {
          const config = { mismatch, blockSize, seed }
          const blocks = runSpeculation(config)
          expect(runSpeculation(config)).toEqual(blocks)
          let accepted = 0, tested = 0, discarded = 0
          const output: Token[] = []
          for (const block of blocks) {
            let context = output.at(-1) ?? 'A'
            let rejected = false
            for (const item of block.proposals) {
              expect(item.context).toBe(context)
              context = item.token
              if (rejected) { expect(item.status).toBe('discarded'); expect(item.draw).toBeNull(); discarded++; continue }
              tested++
              const { draft, target } = distributions(item.context, mismatch)
              const ix = TOKENS.indexOf(item.token)
              expect(draft[ix]).toBeGreaterThan(0)
              expect(item.threshold).toBeCloseTo(Math.min(1, target[ix]! / draft[ix]!))
              rejected = item.draw! >= item.threshold
              expect(item.status).toBe(rejected ? 'rejected' : 'accepted')
              if (!rejected) { accepted++; output.push(item.token) }
            }
            expect(block.tailContext).toBe(output.at(-1) ?? 'A')
            expect(block.tailKind).toBe(rejected ? 'correction' : block.proposals.length ? 'bonus' : 'direct')
            if (rejected) {
              const { draft, target } = distributions(block.tailContext, mismatch)
              const ix = TOKENS.indexOf(block.tailToken)
              expect(target[ix]).toBeGreaterThan(draft[ix]!)
            }
            output.push(block.tailToken)
            expect(block).toMatchObject({ output, accepted, tested, discarded })
          }
          expect(output).toHaveLength(OUTPUT_LENGTH)
          expect(accepted + blocks.length).toBe(OUTPUT_LENGTH)
        }
      }
    }
  })
})

it('samples the correct joint distribution for the first two contextual tokens', () => {
  const samples = 6000
  for (const mismatch of [0, 50, 100]) {
    const pairs = Array<number>(9).fill(0)
    for (let seed = 1; seed <= samples; seed++) {
      const sequence = runSpeculation({ mismatch, seed, blockSize: 3 }).at(-1)!.output
      const pair = 3 * TOKENS.indexOf(sequence[0]!) + TOKENS.indexOf(sequence[1]!)
      pairs[pair] = pairs[pair]! + 1
    }
    for (const [i, token] of TOKENS.entries()) {
      for (const [j, conditional] of distributions(token, mismatch).target.entries()) {
        const expected = distributions('A', mismatch).target[i]! * conditional
        expect(Math.abs(pairs[3 * i + j]! / samples - expected)).toBeLessThan(.02)
      }
    }
  }
})
