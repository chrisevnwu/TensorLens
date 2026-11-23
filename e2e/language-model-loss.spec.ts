import { expect, test } from './fixture'
import { lossCopy } from '../src/i18n/labs/language-model-loss'
import { workbenchCopy } from '../src/i18n/workbench'

test('recovers uniform perplexity, exposes an expensive error and replays its exact scoring mask', async ({ page, context }, info) => {
  const mobile = info.project.name === 'mobile'
  const locale = mobile ? 'zh' : 'en'
  const t = lossCopy[locale]
  const shell = workbenchCopy[locale]
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('./#/labs/language-model-loss?preset=uniform')
  if (mobile) await page.getByRole('button', { name: '简体中文', exact: true }).click()
  const current = page.locator('.loss-comparison tr[data-model=current]')
  const reference = page.locator('.loss-comparison tr[data-model=reference]')
  const last = page.getByRole('group', { name: t.steps, exact: true }).getByRole('button').last()
  await last.click()
  await expect(current.locator('td').nth(2)).toHaveText('4.000')
  await expect(reference.locator('td').nth(2)).toHaveText((384 ** (1 / 7)).toFixed(3))
  if (mobile) await page.locator('#tab-controls').click()
  await page.getByRole('button', { name: t.presets.overconfident, exact: true }).click()
  await expect(current.locator('td').first()).toHaveText('6/7')
  await expect(reference.locator('td').first()).toHaveText('6/7')
  expect(Number(await current.locator('td').nth(1).innerText())).toBeGreaterThan(Number(await reference.locator('td').nth(1).innerText()))
  await page.getByRole('switch', { name: t.include }).click()
  await expect(current.locator('td').first()).toHaveText('6/6')
  await expect(reference.locator('td').nth(2)).toHaveText('2.000')
  await expect(last).toHaveAttribute('data-included', 'false')
  if (mobile) await page.locator('#tab-challenges').click()
  await expect(page.locator('#wb-challenges li[data-complete=true]')).toHaveCount(3)
  await page.getByRole('button', { name: shell.share, exact: true }).click()
  const shared = await page.evaluate(() => navigator.clipboard.readText())
  expect(new URLSearchParams(shared.split('?')[1]).get('mask')).toBe('63')
  await page.goto('about:blank')
  await page.goto(shared)
  await expect(current.locator('td').first()).toHaveText('6/6')
  await expect(last).toHaveAttribute('aria-pressed', 'true')
  await expect(last).toHaveAttribute('data-included', 'false')
})
