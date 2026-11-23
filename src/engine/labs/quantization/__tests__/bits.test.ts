import { expect, it } from 'vitest'
import { bitRows, FLOAT_FORMATS, flipMaskBit, isExponentScalingFlip } from '../bits'

it('starts every float row from the same scalar and preserves binary32 rounding', () => {
  const value = 3.1415927
  const rows = bitRows(value)
  expect(rows.map(row => row.format)).toEqual(FLOAT_FORMATS)
  expect(rows[0]!.represented).toBe(Math.fround(value))
  expect(rows[0]!.digits).toHaveLength(32)
  expect(rows.every(row => row.original === value && row.absError === Math.abs(value-row.represented))).toBe(true)
})
it('reports normal and subnormal range endpoints for the logarithmic number line', () => {
  const [fp32,fp16,bf16,e4m3,e5m2] = bitRows(1)
  expect(fp32!.maxFinite).toBe(Math.fround(3.4028234663852886e38))
  expect(fp16!.minNormal).toBe(2**-14)
  expect(fp16!.minSubnormal).toBe(2**-24)
  expect(bf16!.minSubnormal).toBe(2**-133)
  expect(e4m3!.maxFinite).toBe(448)
  expect(e5m2!.maxFinite).toBe(57344)
})
it('flips the sign bit of FP32 twice without overflowing the unsigned payload', () => {
  const mask = flipMaskBit('fp32',0,0)
  expect(mask).toBe(2**31)
  expect(bitRows(1,{fp32:mask})[0]!.represented).toBe(-1)
  expect(flipMaskBit('fp32',mask,0)).toBe(0)
  expect(() => flipMaskBit('fp32',0,32)).toThrow(RangeError)
})
it.each(['bf16','fp8_e4m3'] as const)('decodes an exact exponent shift in %s and leaves the other rows intact', format => {
  const normal = bitRows(1.5).find(row => row.format === format)!
  const mask = flipMaskBit(format,0,normal.exponentBits.length)
  const rows = bitRows(1.5,{[format]:mask})
  const edited = rows.find(row => row.format === format)!
  expect(edited.represented).toBe(.75)
  expect(edited.ulp).toBe(normal.ulp! / 2)
  expect(rows.filter(row => row !== edited).every(row => row.represented === 1.5)).toBe(true)
})
it('distinguishes saturation, overflow and intentionally created special encodings', () => {
  const rows = bitRows(1e20)
  expect(rows.find(r => r.format==='fp16')!.isInf).toBe(true)
  expect(rows.find(r => r.format==='bf16')!.represented).toBeGreaterThan(9e19)
  expect(rows.find(r => r.format==='fp8_e4m3')!.represented).toBe(448)
  const special = bitRows(448,{fp8_e4m3:1}).find(r=>r.format==='fp8_e4m3')!
  expect(special.isNaN).toBe(true)
  expect(special.ulp).toBeNull()
})

it('awards exponent scaling only when a normal value changes by a power of two', () => {
  expect(isExponentScalingFlip(1.5,'bf16',0,8)).toBe(true)
  expect(isExponentScalingFlip(-1.5,'fp8_e4m3',0,4)).toBe(true)
  expect(isExponentScalingFlip(0,'bf16',0,8)).toBe(false)
  expect(isExponentScalingFlip(448,'fp8_e4m3',0,7)).toBe(false)
  expect(isExponentScalingFlip(1.5,'bf16',0,0)).toBe(false)
  expect(isExponentScalingFlip(1.5,'fp16',0,5)).toBe(false)
})
