import { expect, it } from 'vitest'
import { Matrix } from '../../../math/matrix'
import { quantizeTensor } from '../engine'

it.each([[1, 8, 15], [-15, -8, -1], [3,3,3], [0,0,0]])('preserves affine endpoints and zero in single-sign ranges %j', (...values) => {
  const input = Matrix.from2D([values])
  const result = quantizeTensor(input, { method: 'int4_asym', groupSize: 8, smoothAlpha: 0 })
  expect(result.dequantized.to2D()).toEqual([values])
  for (let c = 0; c < values.length; c++) {
    const zero = result.zeroPoints.get(0,c), code = result.codes.get(0,c)
    expect(zero).toBeGreaterThanOrEqual(0)
    expect(zero).toBeLessThanOrEqual(15)
    expect((code - zero) * result.scales.get(0,c)).toBeCloseTo(values[c]!, 12)
  }
})
