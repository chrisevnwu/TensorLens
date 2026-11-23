import '@testing-library/jest-dom/vitest'
import {cleanup,render} from '@testing-library/react'
import {afterEach,expect,it,vi} from 'vitest'
import {simulateLora} from '../../engine/labs/lora-svd/engine'
import {formatExplainedEnergy} from '../../i18n/labs/lora-svd'
import {LoraInspector,LoraStage} from './LoraStage'
afterEach(cleanup)
it('renders factor shapes and adds the learned update to the frozen weight at the inspected cell',()=>{
  const result=simulateLora({rank:2,loraAlpha:8,zeroInitB:true,targetPreset:'low-rank'})
  const step=30,cell={row:2,col:6}
  const view=render(<><LoraStage {...{result,step,cell}} onRankChange={vi.fn()} onStepChange={vi.fn()} onSelectCell={vi.fn()}/>
    <LoraInspector {...{result,step,cell}}/></>)
  expect(view.container.querySelector('[data-factor=B] svg')).toHaveAttribute('viewBox','0 0 20 160')
  expect(view.container.querySelector('[data-factor=A] svg')).toHaveAttribute('viewBox','0 0 160 20')
  const weight=result.target.base.get(2,6)+result.frames[step]!.delta.get(2,6)
  expect(view.container.querySelector('.lora-inspector dd[title="'+weight+'"]')).toBeInTheDocument()
})

it('distinguishes captured energy just below 100 percent from exact recovery in both languages', () => {
  expect(formatExplainedEnergy(.999999, 'en')).toBe('Over 99.99%')
  expect(formatExplainedEnergy(.999999, 'zh')).toBe('高于 99.99%')
  expect(formatExplainedEnergy(1, 'en')).toBe('100.00%')
  expect(formatExplainedEnergy(.975, 'zh')).toBe('97.50%')
})
