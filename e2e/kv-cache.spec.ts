import { expect, test } from './fixture'
import { kvCopy } from '../src/i18n/labs/kv-cache-profiler'
import { workbenchCopy } from '../src/i18n/workbench'

test('shows real decode work and rescues a 24 GB inference budget with grouped FP8 keys and values', async ({ page }, testInfo) => {
  const mobile = testInfo.project.name === 'mobile'
  const locale = mobile ? 'zh' : 'en'
  const text = kvCopy[locale]
  await page.goto('/#/labs/kv-cache-profiler?modelId=llama8&hardwareId=h100&attentionType=MHA&contextLength=4096&batchSize=8&kvPrecision=FP16&step=0')
  if (mobile) await page.getByRole('button', { name: '简体中文' }).click()
  async function panel(name: 'controls' | 'inspector' | 'challenges') {
    if (mobile) await page.locator(`#tab-${name}`).click()
  }
  const cached = page.locator('output[data-path-flops="cached"]')
  const uncached = page.locator('output[data-path-flops="uncached"]')
  await expect(cached).toHaveText('2048')
  await expect(uncached).toHaveText('2048')
  await page.getByRole('button', { name: workbenchCopy[locale].next, exact: true }).click()
  await expect(cached).toHaveText('544')
  await expect(uncached).toHaveText('2720')
  const budget = page.locator('[data-oom]')
  await expect(budget).toHaveAttribute('data-oom', 'false')
  await panel('controls')
  await page.getByLabel(text.hardware, { exact: true }).selectOption('rtx4090')
  await expect(budget).toHaveAttribute('data-oom', 'true')
  await panel('inspector')
  const cacheGB = page.locator('.metric-card').filter({ has: page.getByText(text.cache, { exact: true }) }).locator('output')
  const baseline = await cacheGB.innerText()
  expect(parseFloat(baseline)).toBeCloseTo(17.179869184, 2)
  await panel('challenges')
  await expect(page.locator('#wb-challenges li').first()).toHaveAttribute('data-complete', 'true')
  await panel('controls')
  await page.getByRole('button', { name: 'GQA', exact: true }).click()
  await page.getByRole('button', { name: 'FP8', exact: true }).click()
  await expect(budget).toHaveAttribute('data-oom', 'false')
  await panel('inspector')
  expect(parseFloat(await cacheGB.innerText())).toBeCloseTo(2.147483648, 2)
  await panel('challenges')
  await expect(page.locator('#wb-challenges li').nth(1)).toHaveAttribute('data-complete', 'true')
})
