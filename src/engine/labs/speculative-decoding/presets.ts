import type { SpecConfig } from './engine'

export const SPEC_PRESETS = {
  matched: { mismatch: 0, blockSize: 3, seed: 7 },
  'missing-support': { mismatch: 100, blockSize: 3, seed: 7 },
  mixed: { mismatch: 50, blockSize: 3, seed: 7 },
} satisfies Record<string, SpecConfig>

export type SpecPreset = keyof typeof SPEC_PRESETS
