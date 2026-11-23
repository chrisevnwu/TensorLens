import '@testing-library/jest-dom/vitest'
import {cleanup,render} from '@testing-library/react'
import {afterEach,expect,it} from 'vitest'
import {simulateDiffusion,type DiffusionConfig,type SolverId} from '../../engine/labs/diffusion-flow/engine'
import {DiffusionStage} from './DiffusionStage'
afterEach(cleanup)

it('matches solver starts, overlays and clocks through a synchronized comparison',()=>{
  const config:DiffusionConfig={dataset:'moons',sampler:'compare',numSteps:5,schedule:'cosine',targetClass:'all',cfgScale:1}
  const result=simulateDiffusion(config)
  const selection={selected:0,onSelect:()=>{}}
  const view=render(<DiffusionStage {...selection} {...{result,config}} step={0} showVectorField={false} showTrails/>)
  const panels=Array.from(view.container.querySelectorAll<HTMLElement>('figure[data-solver]'))
  expect(panels).toHaveLength(3)
  expect(new Set(panels.map(p=>p.dataset.startX+','+p.dataset.startY)).size).toBe(1)
  expect(panels.every(p=>p.dataset.particleCount==='120'&&p.dataset.trailCount==='12'&&p.dataset.fieldCount==='0')).toBe(true)
  expect(panels.map(p=>p.querySelector('dd')?.textContent)).toEqual(['0.000','0.000','0.000'])
  view.rerender(<DiffusionStage {...selection} selected={119} {...{result,config}} step={5} showVectorField showTrails={false}/>)
  for(const panel of panels){
    const path=result.runs[panel.dataset.solver as SolverId]!.map(f=>f.particles[119]!)
    const distance=path.slice(1).reduce((sum,p,i)=>sum+Math.hypot(p.x-path[i]!.x,p.y-path[i]!.y),0)
    const displacement=Math.hypot(path[5]!.x-path[0]!.x,path[5]!.y-path[0]!.y)
    expect(panel.querySelector('.diffusion-position b')).toHaveTextContent('#119')
    expect([...panel.querySelectorAll('dd')].map(v=>v.textContent)).toEqual([distance.toFixed(3),displacement.toFixed(3)])
  }
  expect(panels.map(p=>p.dataset.time)).toEqual(['0','0','1'])
  expect(panels.every(p=>p.dataset.fieldCount==='256'&&p.dataset.trailCount==='0')).toBe(true)
})
