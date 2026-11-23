import { expect, test } from './fixture'
import { samplingCopy } from '../src/i18n/labs/decoding-sampling'
import { workbenchCopy } from '../src/i18n/workbench'
import { runSampling } from '../src/engine/labs/decoding-sampling/engine'
import { sampleMonteCarlo } from '../src/engine/labs/decoding-sampling/monte-carlo'
import { SAMPLE_CONTEXTS, SAMPLING_PRESETS } from '../src/engine/labs/decoding-sampling/presets'

test('replays one hundred sampled tokens and finds a more probable sequence with two beams', async ({ page }, testInfo) => {
  const mobile = testInfo.project.name === 'mobile'
  const locale = mobile ? 'zh' : 'en'
  const text = samplingCopy[locale]
  const shell = workbenchCopy[locale]
  await page.goto('/#/labs/decoding-sampling?preset=story&context=story&mode=sampling&seed=42&step=5')
  if (mobile) await page.getByRole('button', { name: '简体中文' }).click()
  const counts = () => page.locator('g[data-empirical-count]').evaluateAll(elements => elements
    .map(element => [Number(element.getAttribute('data-token-id')), Number(element.getAttribute('data-empirical-count'))] as const)
    .sort((a,b) => a[0]-b[0]).map(entry => entry[1]))
  await page.locator('button[data-draw-count="100"]').click()
  await expect(page.locator('output[data-sample-count]')).toHaveText('100')
  const probabilities = runSampling({ ...SAMPLING_PRESETS[1], ...SAMPLE_CONTEXTS.story }).probabilities
  const expected = sampleMonteCarlo(probabilities, 100, 42)
  expect(await counts()).toEqual(expected.counts)
  await expect(page.locator('output[data-last-token]')).toHaveAttribute('data-last-token', String(expected.lastIndex))
  await expect(page).toHaveURL(/[?&]draws=100(?:&|$)/)
  const saved = page.url()
  await page.goto('about:blank')
  await page.goto(saved)
  await expect(page.locator('output[data-sample-count]')).toHaveText('100')
  expect(await counts()).toEqual(expected.counts)
  if (mobile) await page.locator('#tab-controls').click()
  await page.getByRole('group', { name: shell.presets, exact: true }).getByRole('button', { name: text.presets.trap }).click()
  await page.locator('.wb-stepper input[type="range"]').press('End')
  const best = page.locator('[data-beam-best]')
  const joint = async () => Math.exp(Number(await best.getAttribute('data-logprob')))
  expect(await joint()).toBeCloseTo(.108864, 8)
  const greedy = await best.innerText()
  await page.getByRole('group', { name: text.beamWidth, exact: true }).getByRole('button', { name: '2', exact: true }).click()
  expect(await joint()).toBeCloseTo(.33626, 8)
  await expect(best).not.toHaveText(greedy)
  if (mobile) await page.locator('#tab-challenges').click()
  await expect(page.locator('#wb-challenges li').nth(2)).toHaveAttribute('data-complete', 'true')
})
