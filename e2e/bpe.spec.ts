import { expect, test } from './fixture'
import { workbenchCopy } from '../src/i18n/workbench'

test('selects a third-level BPE merge and reopens the exact shared experiment', async ({ page }, testInfo) => {
  const locale = testInfo.project.name === 'mobile' ? 'zh' : 'en'
  const copy = workbenchCopy[locale]
  const corpus = 'aaaaaaaa'
  const prompt = 'aaaaaaaa\n+&🧠'
  // Exercise the built-in manual share path available when clipboard access is unavailable.
  await page.addInitScript(() => Object.defineProperty(navigator, 'clipboard', { value: undefined }))
  await page.goto('/#/labs/bpe-tokenizer')
  if (locale === 'zh') await page.getByRole('button', { name: '简体中文' }).click()
  const corpusInput = page.locator('textarea[name="corpus"]')
  const promptInput = page.locator('textarea[name="prompt"]')
  await corpusInput.fill(corpus)
  await promptInput.fill(prompt)
  const step = page.locator('.wb-stepper input[type="range"]')
  await step.press('Home')
  await expect(step).toHaveValue('0')
  await page.getByRole('button', { name: copy.last, exact: true }).click()
  await expect(step).toHaveValue('3')
  const depthChallenge = page.locator('#wb-challenges li').nth(2)
  await expect(depthChallenge).toHaveAttribute('data-complete', 'false')
  await page.locator('button[data-token-id="258"]').click()
  await expect(depthChallenge).toHaveAttribute('data-complete', 'true')
  await page.getByRole('button', { name: copy.share, exact: true }).click()
  const shared = await page.getByRole('textbox', { name: copy.share, exact: true }).inputValue()
  await page.goto('about:blank')
  await page.goto(shared)
  await expect(corpusInput).toHaveValue(corpus)
  await expect(promptInput).toHaveValue(prompt)
  await expect(step).toHaveValue('3')
  await expect(page.locator('button[data-token-id="258"]')).toHaveAttribute('aria-pressed', 'true')
  await expect(depthChallenge).toHaveAttribute('data-complete', 'true')
})
