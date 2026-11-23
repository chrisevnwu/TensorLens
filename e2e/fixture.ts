import { expect, test as base, type Page } from '@playwright/test'

export async function expectNoOverflow(page: Page) {
  const overflow = await page.evaluate(() =>
    Math.max(document.body.scrollWidth, document.documentElement.scrollWidth) - window.innerWidth)
  expect(overflow).toBeLessThanOrEqual(0)
}

// Attach before navigation so failed lazy imports and first-paint errors are observed.
export const test = base.extend<{ runtime: void }>({
  runtime: [async ({ page }, use) => {
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    page.on('console', message => {
      if (message.type() === 'error' || message.type() === 'warning') errors.push(message.text())
    })
    await use()
    expect(errors).toEqual([])
    await expectNoOverflow(page)
  }, { auto: true }],
})
export { expect }
