import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { simulateAttention } from '../../engine/labs/attention-debugger/engine'
import { AttentionInspector, AttentionStage } from './AttentionStage'

afterEach(cleanup)

it('selects the same query/key indices from arc and matrix interactions', () => {
  const result = simulateAttention({ tokens:['a','b'],numHeads:2,useScaling:true,logitScale:1,maskType:'causal',windowSize:2,topology:'MHA' })
  const onSelectCell = vi.fn()
  const {container} = render(<AttentionStage result={result} headIndex={0} step={4} cell={{row:0,col:0}}
    onSelectCell={onSelectCell} onSelectHead={vi.fn()} />)
  fireEvent.click(screen.getByRole('button', {name:'Query 1: b'}))
  fireEvent.pointerEnter(container.querySelector('.attention-map [data-row="1"][data-col="0"]')!)
  expect(onSelectCell.mock.calls).toEqual([[{row:1,col:0}],[{row:1,col:0}]])
})

it('reports the mask, probability and zero value contribution of a future token', () => {
  const result = simulateAttention({ tokens:['a','b'],numHeads:2,useScaling:true,logitScale:1,maskType:'causal',windowSize:2,topology:'MHA' })
  const {container} = render(<AttentionInspector result={result} headIndex={0} cell={{row:0,col:1}} />)
  expect(container.querySelector('[data-readout="masked"]')).toHaveTextContent('−∞')
  expect(container.querySelector('[data-readout="weight"]')).toHaveTextContent('0.000')
  expect(container.querySelector('.attention-vector:last-child code')).toHaveTextContent('[0.000, 0.000, 0.000, 0.000, 0.000, 0.000]')
})
