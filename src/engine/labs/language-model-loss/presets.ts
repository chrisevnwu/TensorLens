import { ALL_POSITIONS, POSITIONS } from './engine'

export const LOSS_PRESETS = {
  walkthrough: { gap: 2, step: 0, mask: ALL_POSITIONS },
  uniform: { gap: 0, step: 0, mask: ALL_POSITIONS },
  overconfident: { gap: 8, step: POSITIONS - 1, mask: ALL_POSITIONS },
} as const

export type LossPresetId = keyof typeof LOSS_PRESETS
