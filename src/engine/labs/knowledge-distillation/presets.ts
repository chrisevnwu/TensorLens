import type { DistillConfig } from './engine'

export const DISTILL_PRESETS = {
  'hard-target': { alpha: 0, temperature: 1, tail: 2 },
  'soft-targets': { alpha: 1, temperature: 2, tail: 2 },
  'swap-runner-up': { alpha: 1, temperature: 4, tail: -2 },
} satisfies Record<string, DistillConfig>

export type DistillPreset = keyof typeof DISTILL_PRESETS
