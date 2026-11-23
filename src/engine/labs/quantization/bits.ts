import { decodeFloatBits, inspectFloatBits, inspectFloatFormat, type FloatBitBreakdown, type FloatFormat } from '../../math/ieee754'

export const FLOAT_FORMATS = ['fp32','fp16','bf16','fp8_e4m3','fp8_e5m2'] as const
export type BitMasks = Partial<Record<FloatFormat,number>>
export interface BitRow extends FloatBitBreakdown {
  digits: number[]
  unedited: number
  minNormal: number
  minSubnormal: number
  maxFinite: number
}

function rangeFor(format:FloatFormat) {
  const zero = inspectFloatBits(0,format)
  const fractionBits = zero.mantissaBits.length
  // The codec's overflow rule chooses either saturation or infinity.
  const overflow = inspectFloatFormat(Infinity,format)
  const maxBits = overflow.isInf ? overflow.bits-1 : overflow.bits
  return {
    width: 1+zero.exponentBits.length+fractionBits,
    minNormal: decodeFloatBits(2**fractionBits,format),
    minSubnormal: decodeFloatBits(1,format),
    maxFinite: decodeFloatBits(maxBits,format),
  }
}
const ranges = Object.fromEntries(FLOAT_FORMATS.map(format=>[format,rangeFor(format)])) as Record<FloatFormat,ReturnType<typeof rangeFor>>

/** Index 0 is the leftmost displayed bit (the sign). Return an unsigned mask even for FP32. */
export function flipMaskBit(format:FloatFormat, mask:number, index:number) {
  const {width} = ranges[format]
  if (!Number.isInteger(index) || index<0 || index>=width) throw new RangeError('Bit index outside format')
  if (!Number.isInteger(mask) || mask<0 || mask>=2**width) throw new RangeError('Bit mask outside format')
  return (mask ^ 2**(width-1-index)) >>> 0
}

export function bitRows(value:number, masks:BitMasks={}):BitRow[] {
  return FLOAT_FORMATS.map(format => {
    const raw = inspectFloatFormat(value,format)
    const {width,minNormal,minSubnormal,maxFinite} = ranges[format]
    const mask = masks[format] ?? 0
    if (!Number.isInteger(mask) || mask<0 || mask>=2**width) throw new RangeError('Bit mask outside format')
    const edited = inspectFloatBits((raw.bits ^ mask) >>> 0,format)
    return { ...edited, original:value, unedited:raw.represented,
      absError:Math.abs(value-edited.represented),
      digits:[edited.signBit,...edited.exponentBits,...edited.mantissaBits], minNormal,minSubnormal,maxFinite }
  })
}

/** For two normal encodings an exponent-only edit preserves the significand exactly. */
export function isExponentScalingFlip(value:number, format:FloatFormat, mask:number, index:number) {
  if (format!=='bf16' && format!=='fp8_e4m3') return false
  const raw = inspectFloatFormat(value,format)
  if (index<1 || index>raw.exponentBits.length) return false
  const before = inspectFloatBits((raw.bits ^ mask) >>> 0,format)
  const after = inspectFloatBits((raw.bits ^ flipMaskBit(format,mask,index)) >>> 0,format)
  return [before,after].every(row=>row.represented!==0 && Number.isFinite(row.represented) && !row.isSubnormal)
}
