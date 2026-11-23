export const ROPE_PRESETS = [
  { id: 'standard', m: 12, n: 5, offset: 0, ropeBase: 10000, dim: 8, scalingMode: 'none', scaleFactor: 1, compareSinusoidal: false },
  { id: 'llama3', m: 48, n: 5, offset: 0, ropeBase: 500000, dim: 16, scalingMode: 'none', scaleFactor: 1, compareSinusoidal: false },
  { id: 'highfreq', m: 20, n: 5, offset: 0, ropeBase: 100, dim: 8, scalingMode: 'none', scaleFactor: 1, compareSinusoidal: true },
  { id: 'interpolation', m: 32, n: 5, offset: 0, ropeBase: 10000, dim: 12, scalingMode: 'pi', scaleFactor: 4, compareSinusoidal: false },
] as const

export type RopePresetId = typeof ROPE_PRESETS[number]['id']
