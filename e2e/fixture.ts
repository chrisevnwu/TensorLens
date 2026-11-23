import { expect, test as base } from '@playwright/test'

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
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow).toBeLessThanOrEqual(0)
  }, { auto: true }],
})
export { expect }
