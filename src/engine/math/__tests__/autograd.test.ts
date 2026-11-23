import { describe, expect, it } from 'vitest'
import { Value } from '../autograd'

describe('scalar reverse-mode differentiation', () => {
  const operations: Array<[string, (a: Value, b: Value) => Value]> = [
    ['add', (a, b) => a.add(b)], ['sub', (a, b) => a.sub(b)],
    ['mul', (a, b) => a.mul(b)], ['div', (a, b) => a.div(b)],
    ['pow', a => a.pow(2.4)], ['exp', a => a.exp()], ['log', a => a.log()],
    ['relu', a => a.relu()], ['gelu', a => a.gelu()], ['tanh', a => a.tanh()],
    ['sigmoid', a => a.sigmoid()],
  ]
  it.each(operations)('%s agrees with independent central differences on both inputs', (_, apply) => {
    const a = new Value(1.3, 'a', 'param')
    const b = new Value(-0.8, 'b')
    const root = apply(a, b)
    const f = (x: number, y: number) => apply(new Value(x), new Value(y)).value
    root.backward()
    const h = 1e-5
    const da = (f(a.value + h, b.value) - f(a.value - h, b.value)) / (2 * h)
    const db = (f(a.value, b.value + h) - f(a.value, b.value - h)) / (2 * h)
    expect(Math.abs(a.grad - da)).toBeLessThan(1e-5)
    expect(Math.abs(b.grad - db)).toBeLessThan(1e-5)
  })

  it('adds both repeated-parent contributions and resets accumulated gradients before another pass', () => {
    const x = new Value(2, 'x', 'param')
    const square = x.mul(x, 'square')
    const loss = square.add(x, 'loss')
    for (let i = 0; i < 2; i++) {
      loss.backward()
      expect(x.grad).toBe(5)
    }
    const trace = loss.backwardTrace()
    expect(trace.map(frame => frame.find(n => n.label === 'x')!.grad)).toEqual([0, 1, 5, 5])
    const node = trace[0]!.find(n => n.label === 'square')!
    expect(node.localDerivatives).toEqual([2, 2])
    expect(node.parentIds).toEqual([x.id, x.id])
    expect(trace.at(-1)?.find(n => n.id === loss.id)?.grad).toBe(1)
  })

  it('gives distinct graph-local identities even with duplicate labels and deterministic snapshots across builds', () => {
    const build = () => new Value(3, 'x').add(new Value(3, 'x')).mul(2).backwardTrace()
    const trace = build()
    expect(new Set(trace[0]!.map(n => n.id)).size).toBe(trace[0]!.length)
    expect(build()).toEqual(trace)
  })

  it('uses zero gradient at the ReLU kink and finite guarded derivatives near singularities', () => {
    for (const x of [-1, 0]) {
      const node = new Value(x)
      node.relu().backward()
      expect(node.grad).toBe(0)
    }
    for (const loss of [new Value(1).div(0), new Value(0).log(), new Value(900).exp(), new Value(-900).sigmoid()]) {
      loss.backward()
      expect(loss.topologicalOrder().every(node => Number.isFinite(node.grad) && Number.isFinite(node.value))).toBe(true)
    }
    const x = new Value(0)
    x.pow(0).backward()
    expect(x.grad).toBe(0)
  })
})
