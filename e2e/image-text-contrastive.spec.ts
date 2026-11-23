import { contrastiveCopy } from '../src/i18n/labs/image-text-contrastive'
import { workbenchCopy } from '../src/i18n/workbench'
import { expect, test } from './fixture'

test('retrieves a caption in both directions, breaks and restores the diagonal, and replays the selected cell', async ({ page }, info) => {
  const mobile = info.project.name === 'mobile'
  const locale = mobile ? 'zh' : 'en'
  const t = contrastiveCopy[locale], common = workbenchCopy[locale]
  await page.addInitScript(() => Object.defineProperty(navigator, 'clipboard', { value: undefined }))
  await page.goto('./#/labs/image-text-contrastive')
  if (mobile) await page.getByRole('button', { name: '简体中文', exact: true }).click()
  const panel = async (name: 'controls' | 'challenges' | 'inspector') => {
    if (mobile) await page.locator('#tab-' + name).click()
  }
  const preset = page.getByRole('group', { name: common.presets, exact: true })
  const cell = (i: number, j: number) => page.locator('[data-cell="' + i + '-' + j + '"]')
  const step = page.getByRole('group', { name: common.playback }).getByRole('slider')
  const temperature = page.getByRole('slider', { name: t.temperature, exact: true })
  const missions = page.locator('#wb-challenges li')
  const delta = page.locator('.contrastive-baseline dd').nth(1)

  await temperature.press('Home')
  for (let i = 0; i < 3; i++) await temperature.press('ArrowRight')
  await expect(temperature).toHaveValue('0.2')
  await step.press('End')
  await expect(cell(2, 2)).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('.contrastive-prob strong').first()).toHaveText('91.8%')
  await panel('challenges')
  await expect(missions.nth(0)).toHaveAttribute('data-complete', 'true')

  await panel('controls')
  await preset.getByRole('button', { name: t.presets.swapped, exact: true }).click()
  await cell(0, 1).press('Enter')
  await expect(cell(0, 1)).toHaveAttribute('aria-pressed', 'true')
  await panel('inspector')
  await expect(delta).toHaveText('1.3333')
  await panel('challenges')
  await expect(missions.nth(1)).toHaveAttribute('data-complete', 'true')

  await panel('controls')
  await preset.getByRole('button', { name: t.presets.reordered, exact: true }).click()
  await cell(2, 2).click()
  await panel('inspector')
  await expect(delta).toHaveText('0.0000')
  await panel('challenges')
  await expect(missions.nth(2)).toHaveAttribute('data-complete', 'true')

  await panel('controls')
  await page.getByRole('switch', { name: t.broad }).check()
  await page.getByRole('button', { name: t.views.caption, exact: true }).click()
  await cell(1, 2).click()
  const selected = await cell(1, 2).innerText()
  await expect(page.locator('.contrastive-vector').last()).toContainText('[1, 0, 0, 0]')
  await expect(cell(2, 2)).toContainText(selected)
  await page.getByRole('button', { name: common.share, exact: true }).click()
  const url = await page.getByRole('textbox', { name: common.share, exact: true }).inputValue()
  await page.goto('about:blank')
  await page.goto(url)
  await expect(step).toHaveValue('1')
  await expect(cell(1, 2)).toHaveAttribute('aria-pressed', 'true')
  await expect(cell(1, 2)).toHaveText(selected)
  await expect(page.getByRole('switch', { name: t.broad })).toBeChecked()
  await expect(page.getByRole('button', { name: t.views.caption, exact: true })).toHaveAttribute('aria-pressed', 'true')
})
