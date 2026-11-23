import { expect, test } from './fixture'
import { quantCopy } from '../src/i18n/labs/quantization'
import { workbenchCopy } from '../src/i18n/workbench'

test('recovers outlier precision, flips a BF16 exponent, and replays the shared bit state', async ({ page }, testInfo) => {
  const mobile = testInfo.project.name === 'mobile'
  const locale = mobile ? 'zh' : 'en'
  const text = quantCopy[locale]
  const shell = workbenchCopy[locale]
  await page.addInitScript(() => Object.defineProperty(navigator, 'clipboard', { value: undefined }))
  await page.goto('/#/labs/quantization')
  if (mobile) await page.getByRole('button', { name: '简体中文' }).click()
  async function panel(name: 'controls' | 'inspector' | 'challenges') {
    if (mobile) await page.locator(`#tab-${name}`).click()
  }
  const presets = page.getByRole('group', { name: shell.presets, exact: true })
  const sqnr = page.locator('.metric-card').filter({ has: page.getByText(text.sqnr, { exact: true }) }).locator('output')
  await panel('controls')
  await presets.getByRole('button', { name: text.presets.outlier, exact: true }).click()
  await panel('inspector')
  expect(parseFloat(await sqnr.innerText())).toBeCloseTo(8.08187, 1)
  await panel('controls')
  await presets.getByRole('button', { name: text.presets.recovery, exact: true }).click()
  await panel('inspector')
  expect(parseFloat(await sqnr.innerText())).toBeCloseTo(21.92067, 1)
  await panel('controls')
  await presets.getByRole('button', { name: text.presets.precision, exact: true }).click()
  const output = page.locator('output[data-decoded]')
  const represented = async () => Number((await output.innerText()).replaceAll(',', ''))
  await panel('inspector')
  expect(await represented()).toBe(99840)
  await page.locator('button[data-format="bf16"][data-bit="8"]').click()
  expect(await represented()).toBe(49920)
  const activeFormat = page.locator('.wb-stepper input[type="range"]')
  await expect(activeFormat).toHaveValue('2')
  await panel('challenges')
  await expect(page.locator('#wb-challenges li[data-complete="true"]')).toHaveCount(3)
  await page.getByRole('button', { name: shell.share, exact: true }).click()
  const shared = await page.getByRole('textbox', { name: shell.share, exact: true }).inputValue()
  const state = new URLSearchParams(new URL(shared).hash.split('?')[1])
  expect(state.get('format')).toBe('bf16')
  expect(Number(state.get('bf16'))).toBe(128)
  await page.goto('about:blank')
  await page.goto(shared)
  await expect(activeFormat).toHaveValue('2')
  await panel('inspector')
  expect(await represented()).toBe(49920)
})
