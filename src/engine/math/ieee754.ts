export type FloatFormat = 'fp32' | 'fp16' | 'bf16' | 'fp8_e4m3' | 'fp8_e5m2'

interface Layout { exponent: number; mantissa: number; bias: number }

const layouts: Record<FloatFormat, Layout> = {
  fp32: { exponent: 8, mantissa: 23, bias: 127 },
  fp16: { exponent: 5, mantissa: 10, bias: 15 },
  bf16: { exponent: 8, mantissa: 7, bias: 127 },
  fp8_e4m3: { exponent: 4, mantissa: 3, bias: 7 },
  fp8_e5m2: { exponent: 5, mantissa: 2, bias: 15 },
}

export interface FloatBitBreakdown {
  format: FloatFormat
  original: number
  represented: number
  absError: number
  bits: number
  signBit: 0 | 1
  exponentBits: number[]
  mantissaBits: number[]
  exponentBias: number
  isSubnormal: boolean
  isInf: boolean
  isNaN: boolean
  /** Spacing in the current binade. Nonfinite encodings have no ULP. */
  ulp: number | null
}

const f32 = new DataView(new ArrayBuffer(4))

function roundEven(x: number) {
  const lower = Math.floor(x)
  const remainder = x - lower
  return remainder === 0.5 ? lower + (lower % 2) : Math.round(x)
}

function encode(value: number, format: FloatFormat) {
  if (format === 'fp32') {
    f32.setFloat32(0, value)
    return f32.getUint32(0)
  }
  const { exponent, mantissa, bias } = layouts[format]
  const expMask = 2 ** exponent - 1
  const unit = 2 ** mantissa
  const sign = value < 0 || Object.is(value, -0) ? (expMask + 1) * unit : 0
  const magnitude = Math.abs(value)
  const finiteOnly = format === 'fp8_e4m3'
  const special = expMask * unit
  if (Number.isNaN(value)) return special + (finiteOnly ? unit - 1 : unit / 2)
  if (magnitude === 0) return sign
  if (!Number.isFinite(magnitude)) return sign + (finiteOnly ? special + unit - 2 : special)
  const minimumNormal = 2 ** (1 - bias)
  if (magnitude < minimumNormal) return sign + roundEven(magnitude / (minimumNormal / unit))

  // Find the binade before rounding the significand. log2 can round a value
  // just below a power of two up to an integer, so compare the actual value.
  let power = Math.floor(Math.log2(magnitude))
  if (2 ** power > magnitude) power--
  let significand = roundEven(magnitude / 2 ** (power - mantissa))
  if (significand === 2 * unit) { power++; significand = unit }
  const encoded = (power + bias) * unit + significand - unit
  return sign + Math.min(encoded, finiteOnly ? special + unit - 2 : special)
}

export function decodeFloatBits(bits: number, format: FloatFormat): number {
  const { exponent, mantissa, bias } = layouts[format]
  const unit = 2 ** mantissa
  const expMask = 2 ** exponent - 1
  const signBit = (expMask + 1) * unit
  if (!Number.isInteger(bits) || bits < 0 || bits >= 2 * signBit) throw new RangeError('Invalid float payload')
  if (format === 'fp32') {
    f32.setUint32(0, bits)
    return f32.getFloat32(0)
  }
  const sign = bits >= signBit ? -1 : 1
  const e = (bits >>> mantissa) & expMask
  const fraction = bits & (unit - 1)
  if (e === expMask) {
    if (format !== 'fp8_e4m3') return fraction === 0 ? sign * Infinity : NaN
    if (fraction === unit - 1) return NaN
  }
  const significand = (e === 0 ? 0 : 1) + fraction / unit
  return sign * significand * 2 ** (Math.max(e, 1) - bias)
}

function digits(bits: number, count: number) {
  return Array.from({ length: count }, (_, i) => (bits >>> (count - 1 - i)) & 1)
}

export function inspectFloatBits(bits: number, format: FloatFormat): FloatBitBreakdown {
  const represented = decodeFloatBits(bits, format)
  const { exponent, mantissa, bias } = layouts[format]
  const e = (bits >>> mantissa) & (2 ** exponent - 1)
  const fraction = bits & (2 ** mantissa - 1)
  return {
    format, original: represented, represented, absError: 0, bits,
    signBit: bits >>> (exponent + mantissa) ? 1 : 0,
    exponentBits: digits(e, exponent), mantissaBits: digits(fraction, mantissa),
    exponentBias: bias, isSubnormal: e === 0 && fraction !== 0,
    isInf: Math.abs(represented) === Infinity, isNaN: Number.isNaN(represented),
    ulp: Number.isFinite(represented) ? 2 ** (Math.max(1, e) - bias - mantissa) : null,
  }
}

export function inspectFloatFormat(value: number, format: FloatFormat): FloatBitBreakdown {
  const result = inspectFloatBits(encode(value, format), format)
  return { ...result, original: value, absError: Object.is(value, result.represented) ? 0 : Math.abs(value - result.represented) }
}

export function quantizeFloatFormat(value: number, format: FloatFormat): number {
  return decodeFloatBits(encode(value, format), format)
}
