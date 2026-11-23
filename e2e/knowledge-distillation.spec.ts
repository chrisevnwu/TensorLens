import { distillCopy } from '../src/i18n/labs/knowledge-distillation'
import { workbenchCopy } from '../src/i18n/workbench'
import { expect, test } from './fixture'

test('learns a runner-up from soft targets, swaps the teacher preference and replays the edited run', async ({ page }, info) => {
  const mobile = info.project.name === 'mobile'
  const locale = mobile ? 'zh' : 'en'
  const t = distillCopy[locale], wb = workbenchCopy[locale]
  await page.addInitScript(() => Object.defineProperty(navigator, 'clipboard', { value: undefined }))
  await page.goto('./#/labs/knowledge-distillation')
  if (mobile) await page.getByRole('button', { name: '简体中文', exact: true }).click()
  const panel = async (name: 'controls' | 'challenges' | 'inspector') => {
    if (mobile) await page.locator('#tab-' + name).click()
  }
  const step = page.getByRole('group', { name: wb.playback }).getByRole('slider')
  const presets = page.getByRole('group', { name: wb.presets, exact: true })
  const cards = page.locator('.distill-cards')
  const values = (instrument: string) => cards.getByRole('button', { name: instrument, exact: true }).locator('.distill-values span')
  const missions = page.locator('#wb-challenges li')
  await expect(values(t.classes.violin)).toHaveText(['33.3%', '33.3%'])
  await step.press('End')
  await expect(values(t.classes.violin)).toHaveText(['97.7%', '97.7%'])
  await expect(values(t.classes.viola)).toHaveText(['1.2%', '1.2%'])
  await panel('challenges')
  await expect(missions.nth(0)).toHaveAttribute('data-complete', 'true')

  await panel('controls')
  await presets.getByRole('button', { name: t.presets['soft-targets'] }).click()
  const training = page.getByRole('button', { name: t.modes.training, exact: true })
  await training.click()
  await expect(values(t.classes.violin)).toHaveText(['33.3%', '59.2%'])
  await page.getByRole('button', { name: t.modes.predictions, exact: true }).click()
  const curve = (instrument: string) => page.getByRole('slider', { name: t.curve.replace('{class}', instrument), exact: true })
  await curve(t.classes.viola).press('End')
  await expect(step).toHaveValue('60')
  await expect(values(t.classes.viola)).toHaveText(['26.6%', '1.2%'])
  await panel('challenges')
  await expect(missions.nth(1)).toHaveAttribute('data-complete', 'true')

  await panel('controls')
  await presets.getByRole('button', { name: t.presets['swap-runner-up'] }).click()
  await expect(step).toHaveValue('0')
  await step.press('End')
  await expect(values(t.classes.trumpet)).toHaveText(['26.7%', '1.2%'])
  await panel('challenges')
  await expect(missions.nth(2)).toHaveAttribute('data-complete', 'true')

  await panel('controls')
  const temp = page.getByRole('slider', { name: t.temperature, exact: true })
  await temp.press('ArrowRight')
  await expect(step).toHaveValue('0')
  await page.getByRole('slider', { name: t.alpha, exact: true }).press('ArrowLeft')
  await cards.getByRole('button', { name: t.classes.violin }).press('Enter')
  await training.click()
  await step.press('ArrowRight')
  const before = await values(t.classes.violin).allTextContents()
  await page.getByRole('button', { name: wb.share, exact: true }).click()
  const link = await page.getByRole('textbox', { name: wb.share, exact: true }).inputValue()
  await page.goto('about:blank')
  await page.goto(link)
  await expect(temp).toHaveValue('4.5')
  await expect(page.getByRole('slider', { name: t.alpha })).toHaveValue('0.95')
  await expect(step).toHaveValue('1')
  await expect(training).toHaveAttribute('aria-pressed', 'true')
  await expect(curve(t.classes.violin)).toHaveAttribute('aria-valuenow', '1')
  await expect(values(t.classes.violin)).toHaveText(before)
  await panel('inspector')
  await expect(page.locator('.metric-card output')).toHaveCount(4)
})
