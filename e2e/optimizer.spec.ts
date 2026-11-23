import { expect, test } from './fixture'
import { optimizerCopy } from '../src/i18n/labs/backprop-optimizers'
import { workbenchCopy } from '../src/i18n/workbench'

test('compares optimizers in the ravine and restores a usable gradient to a dead ReLU', async ({ page }, testInfo) => {
  const mobile = testInfo.project.name === 'mobile'
  const locale = mobile ? 'zh' : 'en'
  const text = optimizerCopy[locale]
  await page.goto('/#/labs/backprop-optimizers?preset=ravine&step=0')
  if (mobile) await page.getByRole('button', { name: '简体中文' }).click()
  async function panel(name: 'controls' | 'inspector' | 'challenges') {
    if (mobile) await page.locator(`#tab-${name}`).click()
  }
  const slider = page.locator('.wb-stepper input[type="range"]')
  await slider.press('End')
  await expect(slider).toHaveValue('100')
  const sgd = page.locator('[data-optimizer="sgd"][data-loss]')
  const adam = page.locator('[data-optimizer="adam"][data-loss]')
  expect(Number(await adam.getAttribute('data-loss'))).toBeCloseTo(.000557793, 8)
  await expect(sgd).toHaveAttribute('data-diverged', 'true')
  expect(Number(await sgd.getAttribute('data-loss'))).toBeGreaterThan(1e10)
  await panel('challenges')
  await expect(page.locator('#wb-challenges li').first()).toHaveAttribute('data-complete', 'true')
  await panel('controls')
  await page.getByRole('group', { name: workbenchCopy[locale].presets, exact: true })
    .getByRole('button', { name: text.presets.dead, exact: true }).click()
  await slider.press('End')
  const selectedNode = page.locator('g[data-node-label="w₁"]')
  await selectedNode.click()
  expect(Number(await selectedNode.getAttribute('data-node-grad'))).toBe(0)
  await panel('inspector')
  const gradientCheck = (label: string) => page.locator('.dag-checks tbody tr').filter({ has: page.getByText(label, {exact:true}) })
  for (const label of ['w₁', 'w₂', 'b']) {
    const row = gradientCheck(label)
    await expect(row).toBeVisible()
    const values = await row.locator('td').evaluateAll(cells => cells.map(cell => Number(cell.getAttribute('title'))))
    expect(values.slice(0,2)).toEqual([0,0])
  }
  await panel('challenges')
  await expect(page.locator('#wb-challenges li').nth(1)).toHaveAttribute('data-complete', 'true')
  await panel('controls')
  await page.getByRole('slider', { name: 'b', exact:true }).press('End')
  await panel('inspector')
  const values = await gradientCheck('w₁').locator('td').evaluateAll(cells => cells.map(cell => Number(cell.getAttribute('title'))))
  expect(values[0]).toBeCloseTo(5.984, 3)
  expect(values[1]).toBeCloseTo(values[0]!, 4)
  await panel('controls')
  await page.getByRole('button', { name: text.optimize, exact:true }).click()
  const weight = page.getByRole('slider', { name:'w₁',exact:true })
  expect(Number(await weight.inputValue())).toBeLessThan(1.2)
})
