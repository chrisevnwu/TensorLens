import { expect, it } from 'vitest'
import { categoricalColor, divergingColor, sequentialColor } from '../colormaps'

it.each(['dark','light'] as const)('%s ramps clamp, interpolate continuously, and handle zero scale', theme => {
  expect(sequentialColor(-1, theme)).toBe(sequentialColor(0, theme))
  expect(sequentialColor(3, theme)).toBe(sequentialColor(1, theme))
  expect(new Set([0, 0.1, 0.5, 0.9, 1].map(t => sequentialColor(t, theme))).size).toBe(5)
  expect(divergingColor(9, 0, theme)).toBe(divergingColor(0, 1, theme))
  expect(divergingColor(-2, 1, theme)).toBe(divergingColor(-1, 1, theme))
  expect(divergingColor(1, 2, theme)).toBe(divergingColor(2, 4, theme))
  const palette = Array.from({length: 8}, (_, i) => categoricalColor(i, theme))
  expect(new Set(palette).size).toBe(8)
  expect(categoricalColor(-1, theme)).toBe(palette[7])
  expect(categoricalColor(8, theme)).toBe(palette[0])
})
it('resolves different colors for light and dark surfaces', () => {
  expect(sequentialColor(.5, 'light')).not.toBe(sequentialColor(.5, 'dark'))
  expect(divergingColor(0, 0, 'light')).not.toBe(divergingColor(0, 0, 'dark'))
})
