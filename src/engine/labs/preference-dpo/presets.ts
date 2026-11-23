import type { DpoConfig } from './engine'

export const DPO_PRESETS = {
  consensus: { votesA: 20, referencePercentA: 50, beta: 1, rate: .5 },
  split: { votesA: 15, referencePercentA: 50, beta: 1, rate: .5 },
  reversal: { votesA: 2, referencePercentA: 80, beta: 1, rate: 1 },
} satisfies Record<string, DpoConfig>

export type DpoPreset = keyof typeof DPO_PRESETS
