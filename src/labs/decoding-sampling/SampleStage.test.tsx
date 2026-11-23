import '@testing-library/jest-dom/vitest'
import {cleanup,fireEvent,render,screen} from '@testing-library/react'
import {afterEach,expect,it,vi} from 'vitest'
import {runSampling} from '../../engine/labs/decoding-sampling/engine'
import {sampleMonteCarlo} from '../../engine/labs/decoding-sampling/monte-carlo'
import {SampleStage} from './SampleStage'
afterEach(cleanup)
it('uses original token indices for sampled counts, selection and custom logit edits after sorting',()=>{
  const logits=[-2,3,1], tokens=['a','b','c']
  const result=runSampling({logits,counts:[0,0,0],repetitionPenalty:1,frequencyPenalty:0,presencePenalty:0,temperature:1,topK:2,topP:1,minP:0})
  const samples=sampleMonteCarlo(result.probabilities,101)
  const onLogitChange=vi.fn(),onSelectToken=vi.fn()
  const {container}=render(<SampleStage {...{result,tokens,samples,logits,onSelectToken,onLogitChange}}
    selectedToken={1} topP={1} step={5} onSample={vi.fn()} onClear={vi.fn()} custom/>)
  expect(container.querySelector('[data-token-id="0"]')).toHaveAttribute('data-empirical-count','0')
  expect(container.querySelector('[data-token-id="1"]')).toHaveAttribute('data-empirical-count',String(samples.counts[1]))
  fireEvent.keyDown(screen.getByRole('slider',{name:'Raw logit · b'}),{key:'ArrowRight'})
  expect(onLogitChange).toHaveBeenCalledWith(1,3.1)
})
