import { expect, it } from 'vitest'
import { dispatch } from '../dispatch'

it('gives limited slots to the strongest router probabilities with deterministic token ties', () => {
  const result=dispatch([[.7,.3],[.9,.1],[.7,.3],[.6,.4]],1,.75)
  expect(result.capacity).toBe(2)
  expect(result.assigned).toEqual([4,0])
  expect(result.accepted).toEqual([2,0])
  expect(result.routes.filter(r=>!r.dropped).map(r=>r.token).sort()).toEqual([0,1])
  expect(result.droppedRate).toBe(.5)
})
it('uses only original probabilities to weight the experts chosen with a loss-free bias', () => {
  const result=dispatch([[.6,.3,.1]],2,1,[0,0,.9])
  const routes=result.routes
  expect(routes.map(r=>r.expert).sort()).toEqual([0,2])
  expect(routes.find(r=>r.expert===2)?.weight).toBeCloseTo(1/7,12)
  expect(routes.find(r=>r.expert===0)?.weight).toBeCloseTo(6/7,12)
})
