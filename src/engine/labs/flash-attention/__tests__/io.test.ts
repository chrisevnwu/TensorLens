import { expect, it } from 'vitest'
import { scalingCurve, standardBytes, tiledBytes } from '../io'

it('counts one Q read/output write per row and one K/V read per visited column tile', () => {
  // N=8,d=4: four 32-element Q/K/V/O tensors and four materialized 8×8 transfers.
  expect(standardBytes(8,4)).toBe(768)
  expect(tiledBytes(8,4,4,4,false)).toBe(384)
  expect(tiledBytes(8,4,4,4,true)).toBe(320)
  // Tail outer tile holds just two rows; the second K/V load holds two columns.
  expect(tiledBytes(6,4,4,4,false)).toBe(288)
  expect(tiledBytes(6,4,4,4,true)).toBe(256)
})
it('fits each real-scale tile in the requested SRAM and reduces refetches with more space', () => {
  const small = scalingCurve(64,false), large = scalingCurve(228,false)
  expect(small[0]?.n).toBe(512)
  expect(small.at(-1)?.n).toBe(32768)
  small.forEach((point,i) => {
    expect(point.sramBytes).toBeLessThanOrEqual(64 * 1024)
    expect(large[i]!.sramBytes).toBeLessThanOrEqual(228 * 1024)
    expect(large[i]!.flashBytes).toBeLessThanOrEqual(point.flashBytes)
    expect(point.flashBytes).toBeLessThan(point.standardBytes)
  })
})
