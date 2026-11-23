import { expect, test } from './fixture'
import { normalCopy } from '../src/i18n/labs/norm-residual'
import { workbenchCopy } from '../src/i18n/workbench'
import { simulateResidual } from '../src/engine/labs/norm-residual/engine'
import { NORM_PRESETS } from '../src/engine/labs/norm-residual/presets'

test('rescues the residual gradient and inspects the same stack with a different normalization', async ({ page }, testInfo) => {
  const mobile = testInfo.project.name === 'mobile'
  const locale = mobile ? 'zh' : 'en'
  const text = normalCopy[locale]
  await page.goto('/#/labs/norm-residual?numLayers=23&weightGain=1.1&step=0')
  if (mobile) await page.getByRole('button', { name: '简体中文' }).click()
  async function panel(name: 'controls' | 'inspector' | 'challenges') {
    if (mobile) await page.locator(`#tab-${name}`).click()
  }
  const ratio = page.locator('.metric-card').filter({ has: page.getByText(text.gradRatio, { exact: true }) }).locator('output')
  await panel('controls')
  const depth = page.getByRole('slider', { name: text.numLayers, exact: true })
  await depth.press('ArrowRight')
  await expect(depth).toHaveValue('24')
  await panel('inspector')
  await expect(ratio).toBeVisible()
  expect(parseFloat(await ratio.innerText())).toBeGreaterThan(5)
  const rescue = page.locator('#wb-challenges li').nth(1)
  await panel('challenges')
  await expect(rescue).toHaveAttribute('data-complete', 'false')
  await panel('controls')
  const gain = page.getByRole('slider', { name: text.weightGain, exact: true })
  await gain.press('Home')
  const increment = Number(await gain.getAttribute('step'))
  const advances = Math.round((0.6 - Number(await gain.inputValue())) / increment)
  for (let i = 0; i < advances; i++) await gain.press('ArrowRight')
  await expect(gain).toHaveValue('0.6')
  const config = { ...NORM_PRESETS[0], numLayers: 24, weightGain: 0.6 }
  await panel('inspector')
  expect(parseFloat(await ratio.innerText())).toBeCloseTo(simulateResidual(config).gradRatio, 2)
  await panel('challenges')
  await expect(rescue).toHaveAttribute('data-complete', 'true')
  await panel('controls')
  await page.getByRole('button', { name: 'LayerNorm', exact: true }).click()
  await panel('inspector')
  expect(parseFloat(await ratio.innerText())).toBeCloseTo(simulateResidual({ ...config, normType: 'layernorm' }).gradRatio, 2)
  await page.getByRole('button', { name: workbenchCopy[locale].last, exact: true }).click()
  await expect(page.locator('.wb-stepper input[type="range"]')).toHaveValue('24')
})
