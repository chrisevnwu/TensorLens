type ThemeMode = 'dark' | 'light'

interface ColorRamp {
  density: readonly number[]
  signed: readonly number[]
  categories: readonly number[]
}

// Resolved semantic colors for pure engine consumers such as Canvas and exporters.
const ramps: Record<ThemeMode, ColorRamp> = {
  dark: {
    density: [0x1a202e, 0x1e3a8a, 0x0ea5e9, 0x34d399, 0xfde047],
    signed: [0xfb7185, 0x1a202e, 0x38bdf8],
    categories: [0x38bdf8, 0xa78bfa, 0x34d399, 0xfbbf24, 0xfb7185, 0x2dd4bf, 0xfb923c, 0x818cf8],
  },
  light: {
    density: [0xffffff, 0xe0e7ff, 0xa5b4fc, 0x4d97ce, 0x036e9f],
    signed: [0xbf1641, 0xf1f5f9, 0x036e9f],
    categories: [0x036e9f, 0x7435ce, 0x04745a, 0x985300, 0xbf1641, 0x0e7490, 0xc2410c, 0x4338ca],
  },
}

function hex(color: number) { return '#' + color.toString(16).padStart(6, '0') }

function interpolate(stops: readonly number[], t: number) {
  const normalized = Number.isNaN(t) ? 0 : Math.min(1, Math.max(0, t))
  const position = normalized * (stops.length - 1)
  const left = stops[Math.floor(position)]!
  const right = stops[Math.ceil(position)]!
  const fraction = position % 1
  let value = 0
  for (const shift of [16, 8, 0]) {
    const a = (left >>> shift) & 255
    const b = (right >>> shift) & 255
    value |= Math.round(a + (b - a) * fraction) << shift
  }
  return hex(value)
}

export function sequentialColor(t: number, theme: ThemeMode) {
  return interpolate(ramps[theme].density, t)
}

export function divergingColor(value: number, maxAbs: number, theme: ThemeMode) {
  const signed = maxAbs > 0 && !Number.isNaN(value) ? value / maxAbs : 0
  return interpolate(ramps[theme].signed, (signed + 1) / 2)
}

export function categoricalColor(index: number, theme: ThemeMode) {
  const colors = ramps[theme].categories
  const i = Number.isFinite(index) ? Math.trunc(index) : 0
  return hex(colors[((i % colors.length) + colors.length) % colors.length]!)
}
