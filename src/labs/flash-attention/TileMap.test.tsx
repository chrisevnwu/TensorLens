import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { simulateFlash } from '../../engine/labs/flash-attention/engine'
import { TileMap } from './TileMap'

afterEach(cleanup)
it('distinguishes a future masked tile from a skip that has actually executed', () => {
  const config={seqLen:8,blockBr:4,blockBc:4,causalMask:true}
  const result=simulateFlash(config)
  const onStepChange=vi.fn()
  const view=render(<TileMap {...{config,result,onStepChange}} step={0}/>)
  const tile=view.container.querySelector('[data-tile-row="0"][data-tile-col="1"]')!
  expect(tile).toHaveAttribute('data-tile-status','pending')
  fireEvent.click(tile)
  const skip=result.trace.findIndex(s=>s.phase==='skip'&&s.i===0&&s.j===1)
  expect(onStepChange).toHaveBeenCalledWith(skip)
  view.rerender(<TileMap {...{config,result,onStepChange}} step={skip}/>)
  expect(tile).toHaveAttribute('data-tile-status','skipped')
  expect(view.container.querySelector('[data-tile-row="0"][data-tile-col="0"]')).toHaveAttribute('data-tile-status','done')
})
