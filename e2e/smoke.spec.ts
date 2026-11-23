import { expect, test } from '@playwright/test'

test('loads the application without runtime errors or horizontal overflow', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => {
    if (message.type() === 'error' || message.type() === 'warning') errors.push(message.text())
  })

  await page.goto('./')
  await expect(page).toHaveTitle('TensorLens')
  await expect(page.getByRole('main').getByRole('heading', { level: 1, name: 'TensorLens' })).toBeVisible()
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow).toBeLessThanOrEqual(0)
  expect(errors).toEqual([])
})
