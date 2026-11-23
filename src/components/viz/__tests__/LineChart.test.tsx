import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { LineChart } from '../LineChart'

afterEach(cleanup)
it('keeps signed values and zero finite under symmetric logarithmic scaling', () => {
  const select = vi.fn()
  const {container} = render(<LineChart label="Norm" xLabel="Layer"
    series={[{label:'norm',color:'var(--accent-primary)',values:[1e-12, 1, 1e9]}]}
    band={{label:'range',color:'var(--accent-secondary)',low:[-1e-12,-1,-1e9],high:[1e-12,1,1e9]}}
    selectedIndex={1} scale="symlog" onSelectIndex={select} />)
  const y = container.querySelector('polygon')!.getAttribute('points')!.split(' ').map(point=>Number(point.split(',')[1]))
  expect(y.every(Number.isFinite)).toBe(true)
  expect(y[2]).toBeLessThan(y[3]!)
  expect(screen.getByText('0', {selector:'text[x="55"]'})).toBeInTheDocument()
  fireEvent.keyDown(screen.getByRole('slider',{name:'Norm'}),{key:'ArrowRight'})
  expect(select).toHaveBeenCalledWith(2)
})
