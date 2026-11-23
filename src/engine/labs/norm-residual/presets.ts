import type { ResidualConfig } from './engine'

export const NORM_PRESETS = [
  { id: 'modern', numLayers: 16, placement: 'pre-norm', normType: 'rmsnorm', useResidual: true, activation: 'swiglu', weightGain: 1.1, outlierMag: 0 },
  { id: 'classic', numLayers: 12, placement: 'post-norm', normType: 'layernorm', useResidual: true, activation: 'gelu', weightGain: 1.0, outlierMag: 0 },
  { id: 'exploding', numLayers: 32, placement: 'none', normType: 'rmsnorm', useResidual: false, activation: 'relu', weightGain: 1.8, outlierMag: 0 },
  { id: 'outlier', numLayers: 16, placement: 'pre-norm', normType: 'layernorm', useResidual: true, activation: 'swiglu', weightGain: 1.1, outlierMag: 16 },
] as const satisfies readonly (ResidualConfig & { id: string })[]

export type NormPresetId = typeof NORM_PRESETS[number]['id']
