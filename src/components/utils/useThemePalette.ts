import { useLayoutEffect, useState } from 'react'
import { useAppStore } from '../../store/useAppStore'

const names = {
  canvas:'--bg-canvas', surface:'--bg-surface', elevated:'--bg-elevated', grid:'--border-strong',
  primary:'--accent-primary', secondary:'--accent-secondary', good:'--accent-tertiary',
  warn:'--accent-warn', danger:'--accent-danger', text:'--text-primary', muted:'--text-secondary',
} as const
export type ThemePalette = { [K in keyof typeof names]: string }
export function readThemePalette(): ThemePalette {
  const css = getComputedStyle(document.documentElement)
  return Object.fromEntries(Object.entries(names).map(([key, token]) => [key, css.getPropertyValue(token).trim()])) as ThemePalette
}
export function useThemePalette() {
  const theme = useAppStore(state => state.theme)
  const [palette, setPalette] = useState(readThemePalette)
  useLayoutEffect(() => { setPalette(readThemePalette()) }, [theme])
  return palette
}
