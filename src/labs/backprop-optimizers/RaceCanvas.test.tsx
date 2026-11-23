import '@testing-library/jest-dom/vitest'
import {cleanup,fireEvent,render,screen} from '@testing-library/react'
import {afterEach,expect,it,vi} from 'vitest'
import {runRace} from '../../engine/labs/backprop-optimizers/race'
import {RaceCanvas} from './RaceCanvas'
afterEach(cleanup)
it('maps pointer and keyboard inputs to the real landscape start, including inverted screen y',()=>{
  const frames=runRace({landscape:'saddle',startX:0,startY:0,learningRate:.04,beta1:.9,beta2:.99,weightDecay:0,lrSchedule:'constant'},3)
  const onStartChange=vi.fn()
  render(<RaceCanvas {...{frames,onStartChange}} landscape="saddle" step={0} visible={['adam']}/>)
  const canvas=screen.getByRole('img',{name:'Optimizer race'})
  vi.spyOn(canvas,'getBoundingClientRect').mockReturnValue(new DOMRect(0,0,440,232))
  fireEvent.click(canvas,{clientX:331,clientY:59})
  expect(onStartChange).toHaveBeenCalledWith(1.5,1.5)
  fireEvent.keyDown(canvas,{key:'ArrowDown'})
  expect(onStartChange).toHaveBeenLastCalledWith(0,-.05)
})
