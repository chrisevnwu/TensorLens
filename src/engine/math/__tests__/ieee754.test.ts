import { expect, it } from 'vitest'
import { decodeFloatBits, inspectFloatBits, inspectFloatFormat, quantizeFloatFormat, type FloatFormat } from '../ieee754'

const formats: FloatFormat[] = ['fp32', 'fp16', 'bf16', 'fp8_e4m3', 'fp8_e5m2']

it.each(formats)('%s preserves sign, ±zero, NaN and bit ordering', fmt => {
  expect(Object.is(quantizeFloatFormat(-0, fmt), -0)).toBe(true)
  expect(quantizeFloatFormat(NaN, fmt)).toBeNaN()
  const data = inspectFloatFormat(-1.5, fmt)
  expect(data.represented).toBe(-1.5)
  expect(data.signBit).toBe(1)
  expect(data.mantissaBits[0]).toBe(1)
  const bits = Number.parseInt([data.signBit, ...data.exponentBits, ...data.mantissaBits].join(''), 2)
  expect(decodeFloatBits(bits, fmt)).toBe(-1.5)
  expect(data.absError).toBe(0)
})

it.each(['fp8_e4m3', 'fp8_e5m2', 'fp16', 'bf16'] as const)('round-trips all %s finite encodings, classifies NaNs and subnormals', fmt => {
  const width = fmt.startsWith('fp8') ? 8 : 16
  for (let i = 0; i < 2 ** width; i++) {
    const value = decodeFloatBits(i, fmt)
    if (!Number.isNaN(value)) {
      const encoded = inspectFloatFormat(value, fmt)
      if (i !== encoded.bits) throw new Error(fmt + ' failed to round-trip bit pattern ' + i)
    }
  }
  expect(inspectFloatBits(1, fmt).isSubnormal).toBe(true)
  expect(inspectFloatBits((1 << width) - 1, fmt).isNaN).toBe(true)
})

it('distinguishes a finite-only E4M3 terminal bin, E5M2 infinity, and FP16/BF16 range', () => {
  expect(decodeFloatBits(0x7e, 'fp8_e4m3')).toBe(448)
  expect(decodeFloatBits(0x7f, 'fp8_e4m3')).toBeNaN()
  expect(quantizeFloatFormat(10000, 'fp8_e4m3')).toBe(448)
  expect(decodeFloatBits(0x7b, 'fp8_e5m2')).toBe(57344)
  expect(decodeFloatBits(0x7c, 'fp8_e5m2')).toBe(Infinity)
  expect(quantizeFloatFormat(65536, 'fp16')).toBe(Infinity)
  expect(quantizeFloatFormat(65536, 'bf16')).toBe(65536)
  expect(quantizeFloatFormat(65519, 'fp16')).toBe(65504)
  expect(quantizeFloatFormat(65520, 'fp16')).toBe(Infinity)
})

it.each(formats)('%s rounds ties toward an even low bit across normal and subnormal boundaries', fmt => {
  const { ulp } = inspectFloatFormat(1, fmt)
  const s = ulp!
  expect(quantizeFloatFormat(1 + s / 2, fmt)).toBe(1)
  expect(quantizeFloatFormat(1 + 1.5 * s, fmt)).toBe(1 + 2 * s)
  expect(quantizeFloatFormat(-(1 + 1.5 * s), fmt)).toBe(-(1 + 2 * s))
  const min = decodeFloatBits(1, fmt)
  expect(quantizeFloatFormat(min / 2, fmt)).toBe(0)
  expect(quantizeFloatFormat(1.5 * min, fmt)).toBe(2 * min)
})

it('provides the exact binary32 payload and rejects invalid bit widths', () => {
  expect(inspectFloatFormat(Math.PI, 'fp32').bits).toBe(0x40490fdb)
  expect(inspectFloatBits(0x7fc00005, 'fp32').bits).toBe(0x7fc00005)
  expect(() => decodeFloatBits(256, 'fp8_e4m3')).toThrow(RangeError)
})
