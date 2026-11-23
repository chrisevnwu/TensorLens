// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import App from './App'

afterEach(cleanup)

it('identifies the product in the primary content landmark', () => {
  render(<App />)
  expect(within(screen.getByRole('main')).getByRole('heading', {
    level: 1, name: 'TensorLens',
  })).toBeVisible()
})
