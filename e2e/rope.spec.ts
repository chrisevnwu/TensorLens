import { expect, test } from './fixture'
import { ropeCopy } from '../src/i18n/labs/embeddings-rope'
import { workbenchCopy } from '../src/i18n/workbench'

test('preserves the RoPE score under a common shift and verifies the invariance challenge', async ({ page }, testInfo) => {
  const mobile = testInfo.project.name === 'mobile'
  const locale = mobile ? 'zh' : 'en'
  const text = ropeCopy[locale]
  const shell = workbenchCopy[locale]
  await page.goto('/#/labs/embeddings-rope?m=12&n=5&offset=0&scaleFactor=4&step=0')
  if (mobile) await page.getByRole('button', { name: '简体中文' }).click()
  async function panel(name: 'controls' | 'inspector' | 'challenges') {
    if (mobile) await page.locator(`#tab-${name}`).click()
  }
  const dot = page.locator('.metric-card').filter({ has: page.getByText(text.dot, { exact: true }) }).locator('output')
  await panel('inspector')
  await expect(dot).toBeVisible()
  const initial = await dot.innerText()
  expect(Number.isFinite(Number(initial))).toBe(true)
  const challenge = page.locator('#wb-challenges li').first()
  await panel('challenges')
  await expect(challenge).toHaveAttribute('data-complete', 'false')
  await panel('controls')
  const shift = page.getByRole('slider', { name: text.offset, exact: true })
  for (let i = 0; i < 5; i++) await shift.press('ArrowRight')
  await expect(shift).toHaveValue('5')
  await panel('challenges')
  await expect(challenge).toBeVisible()
  await expect(challenge).toHaveAttribute('data-complete', 'true')
  await panel('inspector')
  await expect(dot).toHaveText(initial)
  await panel('controls')
  await page.getByRole('button', { name: text.modes.pi, exact: true }).click()
  await panel('inspector')
  await expect(dot).not.toHaveText(initial)
  const interpolated = await dot.innerText()
  await page.getByRole('button', { name: shell.next, exact: true }).click()
  await expect(page.locator('.wb-stepper input[type="range"]')).toHaveValue('1')
  await expect(dot).toHaveText(interpolated)
})
