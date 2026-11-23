import { expect, it } from 'vitest'
import { simulateRoPE } from '../engine'
import { ROPE_PRESETS } from '../presets'

it('plots the actual live score at the active marker for both signs of relative position', () => {
  for (const m of [1, 9, 27]) {
    for (const scalingMode of ['none', 'pi', 'ntk'] as const) {
      const config = { ...ROPE_PRESETS[0], m, n:9, offset:13, scaleFactor:3, scalingMode }
      const result = simulateRoPE(config)
      const marker = result.curve.find(point => point.distance === Math.abs(m-config.n))
      expect(marker?.[scalingMode]).toBeCloseTo(result.dot, 11)
    }
  }
})
