import { dpoCopy } from '../src/i18n/labs/preference-dpo'
import { workbenchCopy } from '../src/i18n/workbench'
import { expect, test } from './fixture'

test('fits three preference datasets and replays the edited votes and chart', async ({ page }, info) => {
  const mobile = info.project.name === 'mobile'
  const locale = mobile ? 'zh' : 'en'
  const t = dpoCopy[locale], common = workbenchCopy[locale]
  await page.addInitScript(() => Object.defineProperty(navigator, 'clipboard', { value: undefined }))
  await page.goto('./#/labs/preference-dpo')
  if (mobile) await page.getByRole('button', { name: '简体中文', exact: true }).click()

  const step = page.getByRole('group', { name: common.playback }).getByRole('slider')
  const panels = async (name: 'controls' | 'challenges') => {
    if (mobile) await page.locator('#tab-' + name).click()
  }
  const presetter = page.getByRole('group', { name: common.presets, exact: true })
  const odds = page.locator('.dpo-odds strong')
  const missions = page.locator('#wb-challenges li')

  await step.press('Home')
  await expect(odds.nth(1)).toHaveText('A 50.0% · B 50.0%')
  await step.press('ArrowRight')
  await expect(odds.nth(1)).toHaveText('A 56.2% · B 43.8%')
  await step.press('End')
  await panels('challenges')
  await expect(missions.nth(0)).toHaveAttribute('data-complete', 'true')

  await panels('controls')
  await presetter.getByRole('button', { name: t.presets.split, exact: true }).click()
  const plot = page.getByRole('slider', { name: t.fitCurve, exact: true })
  await plot.press('End')
  await expect(step).toHaveValue('60')
  const chance = Number((await odds.nth(1).innerText()).match(/A ([\d.]+)/)![1])
  expect(chance).toBeCloseTo(75, 0)
  await panels('challenges')
  await expect(missions.nth(1)).toHaveAttribute('data-complete', 'true')

  await panels('controls')
  await presetter.getByRole('button', { name: t.presets.reversal, exact: true }).click()
  await expect(odds.nth(0)).toHaveText('A 80.0% · B 20.0%')
  await expect(odds.nth(1)).toHaveText('A 80.0% · B 20.0%')
  await step.press('End')
  await expect(odds.nth(0)).toHaveText('A 80.0% · B 20.0%')
  expect(Number((await odds.nth(1).innerText()).match(/A ([\d.]+)/)![1])).toBeLessThan(45)
  await panels('challenges')
  await expect(missions.nth(2)).toHaveAttribute('data-complete', 'true')

  await panels('controls')
  await page.getByRole('slider', { name: t.votesA, exact: true }).press('ArrowRight')
  await expect(step).toHaveValue('0')
  await page.getByRole('button', { name: t.modes.loss, exact: true }).click()
  await step.press('ArrowRight')
  const before = await odds.nth(1).innerText()
  await page.getByRole('button', { name: common.share, exact: true }).click()
  const link = await page.getByRole('textbox', { name: common.share, exact: true }).inputValue()
  await page.goto('about:blank')
  await page.goto(link)
  await expect(step).toHaveValue('1')
  await expect(page.getByRole('slider', { name: t.lossCurve })).toHaveAttribute('aria-valuenow', '1')
  await expect(odds.nth(1)).toHaveText(before)
  await expect(page.getByRole('slider', { name: t.votesA, exact: true })).toHaveValue('3')
})
