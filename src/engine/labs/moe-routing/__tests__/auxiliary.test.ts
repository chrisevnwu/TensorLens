import { expect, it } from 'vitest'
import { stableSoftmax } from '../../../math/matrix'
import { auxiliaryLoss, auxGradient } from '../engine'

it('matches central differences of the detached-load auxiliary objective for every logit', () => {
  const logits = [[.9,-.2,.5],[-1,.6,.2],[.2,.8,1.5]]
  const assigned = [4,1,1]
  const alpha = .12
  const gradient = auxGradient(logits.map(row=>stableSoftmax(row)),assigned,alpha)
  for (let t=0;t<logits.length;t++) for(let e=0;e<3;e++) {
    const loss = (d:number) => auxiliaryLoss(logits.map((row,r) =>
      stableSoftmax(row.map((x,c)=>x+(t===r && e===c ? d : 0)))),assigned,alpha)
    expect(gradient[t]![e]).toBeCloseTo((loss(1e-5)-loss(-1e-5))/2e-5,8)
  }
})
