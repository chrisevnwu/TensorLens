// Global tensors use FP16 storage. The teaching kernel retains max, sum,
// score/probability scratch and the output accumulator at FP32 precision.
const elementBytes = 2
export function standardBytes(n: number, d: number) {
  return elementBytes * (4*n*n + 4*n*d)
}

export function tiledBytes(n: number, d: number, br: number, bc: number, causal: boolean) {
  if (![n,d,br,bc].every(v => Number.isSafeInteger(v) && v > 0)) {
    throw new RangeError('Matrix dimensions and tile widths must be positive integers')
  }
  let elements = 2*n*d // Read Q and write O once.
  for (let row = 0; row < n; row += br) {
    const end = Math.min(n, row + br)
    const columns = causal ? Math.min(n, Math.ceil(end / bc) * bc) : n
    elements += 2 * columns * d
  }
  return elements * elementBytes
}

export interface ScalingPoint {
  n: number
  d: number
  tile: number
  sramBytes: number
  standardBytes: number
  flashBytes: number
}
function footprint(b: number, d: number) {
  return 6*b*d + 4*b*d + 4*b*b + 8*b
}

/** Square tiles in multiples of eight, selected under an explicit workspace budget. */
export function scalingCurve(sramKB: number, causal: boolean): ScalingPoint[] {
  const d = 64
  const capacity = sramKB * 1024
  if (!Number.isFinite(capacity) || capacity < footprint(8,d)) {
    throw new RangeError('SRAM budget must fit at least one eight-by-eight tile')
  }
  let tile = 8
  while (footprint(tile+8,d) <= capacity && tile < 512) tile += 8
  return [512,1024,2048,4096,8192,16384,32768].map(n => ({
    n, d, tile, sramBytes:footprint(tile,d), standardBytes:standardBytes(n,d),
    flashBytes:tiledBytes(n,d,tile,tile,causal),
  }))
}
