import { expect, test } from './fixture'
import { flashCopy } from '../src/i18n/labs/flash-attention'

test('skips future tiles, proves the final output, and transfers fewer bytes with wider row blocks', async ({ page }, testInfo) => {
  const mobile = testInfo.project.name === 'mobile'
  const text = flashCopy[mobile ? 'zh' : 'en']
  await page.goto('/#/labs/flash-attention?seqLen=16&blockBr=2&blockBc=4&causalMask=false&step=0')
  if (mobile) await page.getByRole('button', { name: '简体中文' }).click()
  async function panel(name: 'controls' | 'inspector' | 'challenges') {
    if (mobile) await page.locator(`#tab-${name}`).click()
  }
  const bytes = page.locator('output[data-flash-bytes]')
  const skipped = page.locator('output[data-skipped-tiles]')
  const step = page.locator('.wb-stepper input[type="range"]')
  const rowSize = page.getByRole('group', { name: text.br, exact: true })
  await panel('controls')
  await page.getByRole('switch', { name: text.causal, exact: true }).check()
  await step.press('End')
  // Q and O transfer once. Each surviving KV tile reads two four-by-four matrices.
  await expect(bytes).toHaveText('1536')
  await expect(skipped).toHaveText('12')
  await rowSize.getByRole('button', { name: '4', exact: true }).click()
  await step.press('End')
  await expect(bytes).toHaveText('896')
  await expect(skipped).toHaveText('6')
  await panel('inspector')
  const error = page.locator('.metric-card').filter({ has: page.getByText(text.error, { exact: true }) }).locator('output')
  await expect(error).toHaveText('< 10⁻¹²')
  await panel('challenges')
  const missions = page.locator('#wb-challenges li')
  await expect(missions.nth(0)).toHaveAttribute('data-complete', 'true')
  await expect(missions.nth(1)).toHaveAttribute('data-complete', 'true')
  await panel('controls')
  await rowSize.getByRole('button', { name: '8', exact: true }).click()
  await step.press('End')
  await expect(bytes).toHaveText('640')
  await panel('challenges')
  await expect(missions.nth(2)).toHaveAttribute('data-complete', 'true')
})
