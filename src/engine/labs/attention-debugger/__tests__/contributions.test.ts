import { expect, it } from 'vitest'
import { inspectCell, simulateAttention } from '../engine'

it('each inspected value contribution adds to the visible head output and the projected output', () => {
  const run = simulateAttention({ tokens: ['a','b','a','c'], numHeads:4, useScaling:true, logitScale:2,
    maskType:'causal', windowSize:2, topology:'GQA' })
  const row = 2
  const joined: number[] = []
  for (const [h, head] of run.heads.entries()) {
    const contributions = run.tokens.map((_, j) => inspectCell(run,h,row,j))
    for (let d = 0; d < run.topology.headDim; d++) {
      const sum = contributions.reduce((total, c) => total + c.valueContribution[d]!, 0)
      expect(sum).toBeCloseTo(head.output.get(row,d), 12)
      joined.push(sum)
    }
    const [first] = contributions
    expect(first!.rawScore).toBeCloseTo(first!.terms.reduce((a,b) => a+b,0), 12)
    expect(contributions[3]!.valueContribution.every(value => value === 0)).toBe(true)
  }
  for (let o = 0; o < run.output.cols; o++) {
    const sum = joined.reduce((total, value, i) => total + value * run.Wo.get(i,o), 0)
    expect(run.output.get(row,o)).toBeCloseTo(sum, 11)
  }
})
