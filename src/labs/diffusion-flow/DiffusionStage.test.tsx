import '@testing-library/jest-dom/vitest'
import {cleanup,render} from '@testing-library/react'
import {afterEach,expect,it} from 'vitest'
import {simulateDiffusion,type DiffusionConfig} from '../../engine/labs/diffusion-flow/engine'
import {DiffusionStage} from './DiffusionStage'
afterEach(cleanup)

it('matches solver starts, overlays and clocks through a synchronized comparison',()=>{
  const config:DiffusionConfig={dataset:'moons',sampler:'compare',numSteps:5,schedule:'cosine',targetClass:'all',cfgScale:1}
  const result=simulateDiffusion(config)
  const view=render(<DiffusionStage {...{result,config}} step={0} showVectorField={false} showTrails/>)
  const panels=Array.from(view.container.querySelectorAll<HTMLElement>('figure[data-solver]'))
  expect(panels).toHaveLength(3)
  expect(new Set(panels.map(p=>p.dataset.startX+','+p.dataset.startY)).size).toBe(1)
  expect(panels.every(p=>p.dataset.particleCount==='120'&&p.dataset.trailCount==='12'&&p.dataset.fieldCount==='0')).toBe(true)
  view.rerender(<DiffusionStage {...{result,config}} step={5} showVectorField showTrails={false}/>)
  expect(panels.map(p=>p.dataset.time)).toEqual(['0','0','1'])
  expect(panels.every(p=>p.dataset.fieldCount==='256'&&p.dataset.trailCount==='0')).toBe(true)
})
