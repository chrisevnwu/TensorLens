import '@testing-library/jest-dom/vitest'
import {cleanup,render} from '@testing-library/react'
import {afterEach,expect,it} from 'vitest'
import {simulateMoe} from '../../engine/labs/moe-routing/engine'
import {MoeInspector} from './MoeStage'
afterEach(cleanup)
it('keeps a dropped route’s gate and probability observable in both directions',()=>{
  const result=simulateMoe({numExperts:6,numTokens:16,topK:2,capacityFactor:.75,balancingMode:'none',auxAlpha:.05,routerNoise:.05})
  const frame=result.frames[25]!
  const route=frame.routes.find(r=>r.dropped)!
  const view=render(<MoeInspector result={result} step={25} selection={{kind:'token',index:route.token}}/>)
  expect(view.container.querySelector('[data-prob-expert="'+route.expert+'"]')).toHaveTextContent(route.probability.toFixed(6))
  expect(view.container.querySelector('[data-gate-expert="'+route.expert+'"]')!.closest('tr')).toHaveAttribute('data-accepted','false')
  view.rerender(<MoeInspector result={result} step={25} selection={{kind:'expert',index:route.expert}}/>)
  const rejected=[...view.container.querySelectorAll<HTMLTableRowElement>('tr[data-accepted=false]')].map(tr=>tr.cells[0]?.textContent)
  expect(rejected).toContain('T'+route.token)
})
