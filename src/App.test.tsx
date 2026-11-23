import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import App from './App'
import { useAppStore } from './store/useAppStore'

afterEach(cleanup)

it.each([
  ['en', 'Multi-Head Attention Debugger'],
  ['zh', '自注意力与多头注意力调试器'],
] as const)('exposes the searchable lab catalog in %s', (locale, name) => {
  useAppStore.getState().setLocale(locale)
  render(<App />)
  expect(screen.getByRole('main')).toBeVisible()
  expect(screen.getByRole('link', { name: new RegExp(name) })).toBeVisible()
})
