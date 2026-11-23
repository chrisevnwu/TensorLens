import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { simulateQuant } from '../../engine/labs/quantization/engine'
import { QuantInspector, QuantStage } from './QuantStage'
afterEach(cleanup)

it('links all three heatmaps to the same tensor coordinate and reads its reconstruction code',()=>{
  const result=simulateQuant({method:'int4_group',groupSize:8,outlierMag:20,smoothAlpha:.5})
  const cell={row:2,col:3},onSelectCell=vi.fn()
  const view=render(<><QuantStage {...{result,cell,onSelectCell}}/><QuantInspector {...{result,cell}}/></>)
  const tiles=view.container.querySelectorAll('.quant-maps rect[data-row="2"][data-col="3"]')
  expect(tiles).toHaveLength(3)
  for(const el of tiles)fireEvent.click(el)
  expect(onSelectCell.mock.calls).toEqual([[cell],[cell],[cell]])
  expect(view.container.querySelector('[data-quant-readout=code]')).toHaveTextContent(String(result.codes.get(2,3)))
  expect(view.container.querySelector('[data-quant-readout=dequantized]')).toHaveAttribute('title',String(result.dequantized.get(2,3)))
})
