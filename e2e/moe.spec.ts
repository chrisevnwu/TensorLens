import { expect, test } from './fixture'
import { moeCopy } from '../src/i18n/labs/moe-routing'
import { MOE_PRESETS } from '../src/engine/labs/moe-routing/presets'
import { simulateMoe } from '../src/engine/labs/moe-routing/engine'

test('balances collapsed expert assignments, inspects a token probability and retains its completed missions', async ({ page }, testInfo) => {
  const mobile = testInfo.project.name === 'mobile'
  const text = moeCopy[mobile ? 'zh' : 'en']
  await page.goto('/#/labs/moe-routing?step=0')
  if (mobile) await page.getByRole('button', { name: '简体中文' }).click()
  async function panel(name: 'controls' | 'inspector' | 'challenges') {
    if (mobile) await page.locator(`#tab-${name}`).click()
  }
  const methods = page.getByRole('group', { name: text.mode, exact: true })
  const metric = (name: string) => page.locator('.metric-card').filter({ has: page.getByText(name, { exact: true }) }).locator('output')
  const step = page.locator('.wb-stepper input[type="range"]')
  await panel('controls')
  await methods.getByRole('button', { name: text.modes.none, exact: true }).click()
  await step.press('End')
  await expect(step).toHaveValue('30')
  await panel('inspector')
  const collapsedCV = parseFloat(await metric(text.cv).innerText())
  expect(collapsedCV).toBeCloseTo(Math.sqrt(2), 2)
  expect(parseFloat(await metric(text.dropped).innerText())).toBeCloseTo(56.25, 0)
  await panel('challenges')
  const missions = page.locator('#wb-challenges li')
  await expect(missions.first()).toHaveAttribute('data-complete', 'true')
  await expect(missions.nth(1)).toHaveAttribute('data-complete', 'false')
  await panel('controls')
  await methods.getByRole('button', { name: text.modes['aux-loss'], exact: true }).click()
  await expect(step).toHaveValue('30')
  await page.locator('g[data-token="3"]').click()
  await panel('inspector')
  const expected = simulateMoe(MOE_PRESETS[0]).frames[30]!
  const route = expected.routes.find(r => r.token === 3)!
  const probability = page.locator(`#wb-inspector td[data-prob-expert="${route.expert}"]`)
  expect(parseFloat(await probability.innerText())).toBeCloseTo(route.probability, 5)
  expect(parseFloat(await metric(text.cv).innerText())).toBeCloseTo(expected.loadCV, 2)
  expect(parseFloat(await metric(text.dropped).innerText())).toBe(0)
  await panel('challenges')
  await expect(missions.nth(1)).toHaveAttribute('data-complete', 'true')
  await step.press('Home')
  await expect(page).toHaveURL(/[?&]step=0(?:&|$)/)
  await page.reload()
  await expect(step).toHaveValue('0')
  await panel('challenges')
  await expect(missions.first()).toHaveAttribute('data-complete', 'true')
  await expect(missions.nth(1)).toHaveAttribute('data-complete', 'true')
})
