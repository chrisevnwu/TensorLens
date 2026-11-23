import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { simulateRoPE } from '../../engine/labs/embeddings-rope/engine'
import { DecayCurve } from './DecayCurve'

afterEach(cleanup)

it('exposes the exact signed-side score at the marker and bounds keyboard jumps', () => {
  const result = simulateRoPE({ m: 2, n: 14, offset: 3, dim: 8, ropeBase: 10000, scalingMode: 'ntk', scaleFactor: 4, compareSinusoidal: true })
  const onChange = vi.fn()
  render(<DecayCurve points={result.curve} distance={12} mode="ntk" compare onChange={onChange} />)
  const slider = screen.getByRole('slider', { name: 'Relative distance' })
  expect(slider).toHaveAttribute('aria-valuetext', `|Δ| = 12, Dot product = ${result.dot.toFixed(4)}`)
  for (const key of ['ArrowRight', 'End', 'Home']) fireEvent.keyDown(slider, { key })
  expect(onChange.mock.calls).toEqual([[13], [64], [0]])
})
