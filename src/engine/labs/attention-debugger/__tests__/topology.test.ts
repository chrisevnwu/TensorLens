import { expect, it } from 'vitest'
import { buildTopology } from '../topology'

it('allocates one key and one value projection per KV head and groups consecutive queries', () => {
  expect(buildTopology(4, 'MHA')).toMatchObject({ numKvHeads:4, headDim:3, kvParameters:288, sharingRatio:1, links:[0,1,2,3] })
  expect(buildTopology(4, 'GQA')).toMatchObject({ numKvHeads:2, headDim:3, kvParameters:144, sharingRatio:2, links:[0,0,1,1] })
  expect(buildTopology(4, 'MQA')).toMatchObject({ numKvHeads:1, headDim:3, kvParameters:72, sharingRatio:4, links:[0,0,0,0] })
  expect(buildTopology(1, 'GQA')).toMatchObject({ numKvHeads:1, headDim:12, kvParameters:288, links:[0] })
  expect(() => buildTopology(5, 'MHA', 12)).toThrow()
})
