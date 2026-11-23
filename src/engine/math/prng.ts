export interface SeededRng {
  next(): number
  nextGaussian(mean?: number, std?: number): number
  nextInt(min: number, max: number): number
  shuffle<T>(items: readonly T[]): T[]
}

export function createRng(seed: number): SeededRng {
  let state = seed | 0
  let spare: number | undefined
  const next = () => {
    state = (state + 0x6d2b79f5) | 0
    let bits = Math.imul(state ^ (state >>> 15), state | 1)
    bits ^= bits + Math.imul(bits ^ (bits >>> 7), bits | 61)
    return ((bits ^ (bits >>> 14)) >>> 0) / 4294967296
  }
  function nextInt(min: number, max: number) {
    if (!Number.isSafeInteger(min) || !Number.isSafeInteger(max) || max < min) throw new RangeError('Invalid integer range')
    return min + Math.floor(next() * (max - min + 1))
  }
  return {
    next, nextInt,
    nextGaussian(mean = 0, std = 1) {
      let normal = spare
      if (normal === undefined) {
        const radius = Math.sqrt(-2 * Math.log(1 - next()))
        const angle = 2 * Math.PI * next()
        normal = radius * Math.cos(angle)
        spare = radius * Math.sin(angle)
      } else {
        spare = undefined
      }
      return mean + normal * std
    },
    shuffle(items) {
      const shuffled = [...items]
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = nextInt(0, i)
        const previous = shuffled[i]!
        shuffled[i] = shuffled[j]!
        shuffled[j] = previous
      }
      return shuffled
    },
  }
}
