import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import { buildDecodeTrace } from '../../engine/labs/kv-cache-profiler/trace'
import { DecodeMatrix } from './DecodeMatrix'

afterEach(cleanup)
it('renders one active cached query and all recomputed queries at a decode step', () => {
  const frame = buildDecodeTrace()[3]!
  const { container } = render(<><DecodeMatrix frame={frame} mode="both" path="cached"/>
    <DecodeMatrix frame={frame} mode="both" path="uncached"/></>)
  expect(screen.getByText(`Q (1 × ${frame.dim}) · Kᵀ (${frame.dim} × ${frame.length})`)).toBeVisible()
  expect(screen.getByText(`Q (${frame.length} × ${frame.dim}) · Kᵀ (${frame.dim} × ${frame.length})`)).toBeVisible()
  expect(container.querySelector('[data-path-flops=cached]')).toHaveTextContent(String(frame.cached.flops))
  expect(container.querySelectorAll('svg')[0]!.querySelectorAll('title')).toHaveLength(frame.length * 2)
  expect(container.querySelectorAll('svg')[1]!.querySelectorAll('title')).toHaveLength(frame.length * (frame.length+1))
})
