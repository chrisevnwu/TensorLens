import { expect, test } from './fixture'
import { loraCopy } from '../src/i18n/labs/lora-svd'
import { workbenchCopy } from '../src/i18n/workbench'

test('trains a zero-initialized rank-three adapter to its SVD floor and compares the 70B budget', async ({ page }, testInfo) => {
  const mobile = testInfo.project.name === 'mobile'
  const locale = mobile ? 'zh' : 'en'
  const text = loraCopy[locale]
  await page.goto('/#/labs/lora-svd?step=0')
  if (mobile) await page.getByRole('button', { name: '简体中文' }).click()
  const stage = page.locator('.lora-stage')
  const number = async (attribute: string) => Number(await stage.getAttribute(attribute))
  await page.locator('[data-singular-index="2"]').click()
  const initial = await number('data-adapter-mse')
  const floor = await number('data-svd-floor')
  expect(initial).toBeCloseTo(.202453966, 7)
  expect(floor).toBeCloseTo(5.272601e-6, 10)
  expect(await number('data-explained-energy')).toBeGreaterThan(.95)
  await page.locator('.wb-stepper input[type="range"]').press('End')
  await expect(page.locator('.wb-stepper input[type="range"]')).toHaveValue('100')
  const trained = await number('data-adapter-mse')
  expect(trained).toBeGreaterThanOrEqual(floor - 1e-12)
  expect(trained).toBeLessThanOrEqual(1.1 * floor)
  if (mobile) await page.locator('#tab-challenges').click()
  const missions = page.locator('#wb-challenges li')
  await expect(missions.nth(1)).toHaveAttribute('data-complete', 'true')
  if (mobile) await page.locator('#tab-controls').click()
  const presets = page.getByRole('group', { name: workbenchCopy[locale].presets, exact: true })
  await presets.getByRole('button', { name: text.presets.stress }).click()
  expect(await number('data-explained-energy')).toBeLessThan(.35)
  if (mobile) await page.locator('#tab-challenges').click()
  await expect(missions.nth(2)).toHaveAttribute('data-complete', 'true')
  if (mobile) await page.locator('#tab-controls').click()
  await presets.getByRole('button', { name: text.presets.budget }).click()
  // NF4 with a 16-bit scale per 64 weights + rank-eight Q/V adapters and retained activations.
  const adapterParameters = 2 * 80 * 8 * (8192 + 8192)
  const expected = 70e9 / 2 + 2 * (70e9 / 64) + 16 * adapterParameters + 4 * 2048 * 8192 * 80
  await expect(page.locator('output[data-memory-total="qlora"]')).toHaveAttribute('data-bytes', String(expected))
})
