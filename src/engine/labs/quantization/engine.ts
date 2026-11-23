import { Matrix, cosineSimilarity, mse, sqnrDb } from '../../math/matrix'
import { inspectFloatFormat } from '../../math/ieee754'
import { createRng } from '../../math/prng'

// NormalFloat4 codebook used by QLoRA, in ascending code-index order.
// https://github.com/bitsandbytes-foundation/bitsandbytes/blob/main/bitsandbytes/functional.py#get_4bit_type
export const NF4_CODEBOOK = [
  -1, -0.6961928009986877, -0.5250730514526367, -0.39491748809814453,
  -0.28444138169288635, -0.18477343022823334, -0.09105003625154495, 0,
  0.07958029955625534, 0.16093020141124725, 0.24611230194568634, 0.33791524171829224,
  0.44070982933044434, 0.5626170039176941, 0.7229568362236023, 1,
] as const

export type QuantMethod = 'fp16' | 'bf16' | 'fp8_e4m3' | 'int8_sym' | 'int8_asym' | 'int4_sym' | 'int4_asym' | 'int4_group' | 'nf4'
export interface QuantConfig {
  method: QuantMethod
  groupSize: number
  outlierMag: number
  smoothAlpha: number
}
export interface QuantResult {
  method: QuantMethod
  original: Matrix
  dequantized: Matrix
  errors: Matrix
  codes: Matrix
  scales: Matrix
  zeroPoints: Matrix
  channelScales: number[]
  groupSize: number
  mse: number
  maxAbsError: number
  sqnrDb: number
  cosineSimilarity: number
  effectiveBits: number
}

export function generateTensor(outlierMag: number, seed = 42) {
  const tensor = Matrix.randomNormal(16, 16, createRng(seed))
  // Two isolated activation spikes in different channels and distinct groups.
  tensor.set(2, 3, tensor.get(2, 3) + outlierMag)
  tensor.set(12, 11, tensor.get(12, 11) - outlierMag)
  return tensor
}

function nearestNormalFloat(x: number) {
  let code = 0
  for (let i = 1; i < NF4_CODEBOOK.length; i++) {
    if (Math.abs(x - NF4_CODEBOOK[i]!) < Math.abs(x - NF4_CODEBOOK[code]!)) code = i
  }
  return code
}

export function quantizeTensor(original: Matrix, config: Omit<QuantConfig, 'outlierMag'>): QuantResult {
  const { method, smoothAlpha } = config
  if (!Number.isInteger(config.groupSize) || config.groupSize < 1) throw new RangeError('Group size must be a positive integer')
  if (!(smoothAlpha >= 0 && smoothAlpha <= 1)) throw new RangeError('Channel scale exponent must be in [0,1]')
  const { rows, cols, data } = original
  const channelScales = Array.from({ length: cols }, (_, c) => {
    let peak = 0
    for (let r = 0; r < rows; r++) peak = Math.max(peak, Math.abs(original.get(r, c)))
    return (peak || 1) ** smoothAlpha
  })
  const migrated = original.map((v, _r, c) => v / channelScales[c]!)
  const dequantized = Matrix.zeros(rows, cols), errors = Matrix.zeros(rows, cols)
  const scales = Matrix.zeros(rows, cols), zeroPoints = Matrix.zeros(rows, cols), codes = Matrix.zeros(rows, cols)
  const float = method === 'fp16' || method === 'bf16' || method === 'fp8_e4m3'
  const grouped = method === 'nf4' || method === 'int4_group'
  const affine = method === 'int8_asym' || method === 'int4_asym'
  const bits = method === 'fp16' || method === 'bf16' ? 16 : method === 'fp8_e4m3' || method.startsWith('int8') ? 8 : 4
  const groupSize = grouped ? config.groupSize : Math.max(1, data.length)
  const maxCode = affine ? 2 ** bits - 1 : 2 ** (bits - 1) - 1
  let maxAbsError = 0
  for (let start = 0; start < data.length; start += groupSize) {
    const end = Math.min(data.length, start + groupSize)
    // Including zero keeps the affine zero point representable even for a single-sign tensor.
    let min = 0, max = 0
    for (let i = start; i < end; i++) {
      min = Math.min(min, migrated.data[i]!)
      max = Math.max(max, migrated.data[i]!)
    }
    const peak = Math.max(max, -min)
    let scale = 1
    if (!float) scale = (affine ? (max - min) / maxCode : method === 'nf4' ? peak : peak / maxCode) || 1
    const zero = affine ? Math.max(0, Math.min(maxCode, Math.round(-min / scale))) : 0
    for (let i = start; i < end; i++) {
      const value = migrated.data[i]!
      let code: number, decoded: number
      if (method === 'fp16' || method === 'bf16' || method === 'fp8_e4m3') {
        const inspected = inspectFloatFormat(value, method)
        code = inspected.bits
        decoded = inspected.represented
      } else if (method === 'nf4') {
        code = nearestNormalFloat(value / scale)
        decoded = NF4_CODEBOOK[code]! * scale
      } else {
        code = Math.max(affine ? 0 : -maxCode, Math.min(maxCode, Math.round(value / scale) + zero))
        decoded = (code - zero) * scale
      }
      codes.data[i] = code
      scales.data[i] = scale
      zeroPoints.data[i] = zero
      dequantized.data[i] = decoded * channelScales[i % cols]!
      errors.data[i] = Math.abs(data[i]! - dequantized.data[i]!)
      maxAbsError = Math.max(maxAbsError, errors.data[i]!)
    }
  }
  // Storage estimate: one FP16 scale per integer/NF4 group (including the full-tensor group),
  // one b-bit affine zero point per group, and optional FP16 factors for the channel migration.
  const groups = Math.ceil(data.length / groupSize)
  const metadataBits = (float ? 0 : groups * (16 + (affine ? bits : 0))) + (smoothAlpha > 0 ? cols * 16 : 0)
  return {
    method, original, dequantized, errors, scales, zeroPoints, codes, channelScales, groupSize,
    mse: mse(data, dequantized.data), sqnrDb: sqnrDb(data, dequantized.data), maxAbsError,
    cosineSimilarity: cosineSimilarity(data, dequantized.data), effectiveBits: bits + metadataBits / Math.max(1, data.length),
  }
}

export function simulateQuant(config: QuantConfig, seed = 42) {
  return quantizeTensor(generateTensor(config.outlierMag, seed), config)
}
