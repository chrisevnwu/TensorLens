import { speculativeCopy } from '../src/i18n/labs/speculative-decoding'
import { workbenchCopy } from '../src/i18n/workbench'
import { expect, test } from './fixture'

test('verifies a draft, recovers a missing token and compares target calls at equal length', async ({ page }, info) => {
  const mobile = info.project.name === 'mobile'
  const locale = mobile ? 'zh' : 'en'
  const t = speculativeCopy[locale], common = workbenchCopy[locale]
  await page.addInitScript(() => Object.defineProperty(navigator, 'clipboard', { value: undefined }))
  await page.goto('./#/labs/speculative-decoding')
  if (mobile) await page.getByRole('button', { name: '简体中文', exact: true }).click()
  const panel = async (id: 'controls' | 'challenges' | 'inspector') => {
    if (mobile) await page.locator('#tab-' + id).click()
  }
  const step = page.getByRole('group', { name: common.playback }).getByRole('slider')
  const presets = page.getByRole('group', { name: common.presets, exact: true })
  const missions = page.locator('#wb-challenges li')
  const cards = page.getByRole('group', { name: t.outcomes })
  const metrics = page.locator('.metric-card output')
  await expect(cards.locator('[data-status="accepted"]')).toHaveCount(3)
  await expect(cards.locator('[data-status="bonus"]')).toHaveText(t.target + 'A' + t.statuses.bonus)
  await step.press('End')
  await panel('inspector')
  await expect(metrics).toHaveText(['4', '16', '12 / 12', '0'])
  await panel('challenges')
  await expect(missions.nth(0)).toHaveAttribute('data-complete', 'true')

  await panel('controls')
  await presets.getByRole('button', { name: t.presets['missing-support'], exact: true }).click()
  await expect(step).toHaveValue('0')
  await expect(cards.locator('[data-status="rejected"]')).toHaveCount(1)
  await expect(cards.locator('[data-status="discarded"]')).toHaveCount(2)
  await cards.locator('[data-status="correction"]').click()
  await expect(cards.getByRole('button', { pressed: true })).toContainText('B')
  const table = page.locator('.spec-law table')
  await expect(table.getByRole('row', { name: t.draft + ' 100% 0% 0%', exact: true })).toBeVisible()
  await expect(table.locator('tr.spec-final td')).toHaveText(['10%', '70%', '20%'])
  await expect(table.getByRole('row', { name: t.residual + ' 0% 77.8% 22.2%', exact: true })).toBeVisible()
  await panel('challenges')
  await expect(missions.nth(1)).toHaveAttribute('data-complete', 'true')

  await panel('controls')
  await presets.getByRole('button', { name: t.presets.mixed, exact: true }).click()
  await step.press('End')
  await expect(cards.locator('[data-status="direct"]')).toHaveCount(1)
  await panel('inspector')
  await expect(metrics).toHaveText(['10', '16', '6 / 15', '9'])
  await panel('challenges')
  await expect(missions.nth(2)).toHaveAttribute('data-complete', 'true')

  await panel('controls')
  await page.getByRole('slider', { name: t.seed, exact: true }).press('ArrowRight')
  await expect(step).toHaveValue('0')
  await step.press('ArrowRight')
  await cards.getByRole('button').nth(1).click()
  const before = await page.locator('.spec-stage').innerText()
  await page.getByRole('button', { name: common.share, exact: true }).click()
  const url = await page.getByRole('textbox', { name: common.share, exact: true }).inputValue()
  await page.goto('about:blank')
  await page.goto(url)
  await expect(step).toHaveValue('1')
  await expect(page.getByRole('slider', { name: t.seed, exact: true })).toHaveValue('8')
  await expect(cards.getByRole('button').nth(1)).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('.spec-stage')).toHaveText(before, { useInnerText: true })
})
