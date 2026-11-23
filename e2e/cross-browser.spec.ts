import { expectStageSnapshot } from './snapshot'
import { expect, expectNoOverflow, test } from './fixture'
import { LAB_REGISTRY } from '../src/labs/registry'
import { workbenchCopy } from '../src/i18n/workbench'

for (const lab of LAB_REGISTRY) {
  test(lab.id + ' renders, scrubs, restores a frame and downloads its visualization', async ({ page }) => {
    const locale = lab.number % 2 ? 'zh' : 'en'
    const t = workbenchCopy[locale]
    await page.emulateMedia({ colorScheme: lab.number % 3 ? 'light' : 'dark', reducedMotion: 'reduce' })
    await page.goto('./#/labs/' + lab.id)
    if (locale === 'zh') await page.getByRole('button', { name: '简体中文', exact: true }).click()
    await expect(page.getByRole('heading', { name: lab.title[locale], exact: true })).toBeVisible()
    const transport = page.getByRole('group', { name: t.playback })
    const slider = transport.getByRole('slider')
    await expect(slider).toBeEnabled()
    await slider.press('End')
    const last = await slider.getAttribute('max')
    expect(Number(last)).toBeGreaterThan(0)
    await expect(slider).toHaveValue(last!)
    const parameter = lab.id === 'quantization' ? 'row' : 'step'
    await expect.poll(() => new URLSearchParams(page.url().split('?')[1]).get(parameter)).toBe(last)
    await page.reload()
    await expect(slider).toHaveValue(last!)
    await expectNoOverflow(page)
    await expectStageSnapshot(page, page.getByRole('button', { name: t.export, exact: true }), lab.id)
  })
}

test('renders each sampling formula with valid MathML subscripts', async ({ page }) => {
  await page.goto('./#/labs/decoding-sampling')
  const slider = page.getByRole('group', { name: 'Playback' }).getByRole('slider')
  await slider.press('Home')
  const last = Number(await slider.getAttribute('max'))
  expect(last).toBeGreaterThan(0)
  for (let step = 0; step <= last; step++) {
    if (step > 0) await slider.press('ArrowRight')
    await expect(slider).toHaveValue(String(step))
    const math = page.locator('.formula-bar math')
    await expect(math).toHaveCount(1)
    const invalid = await math.locator('msub, msup, msubsup').evaluateAll(tokens =>
      tokens.filter(token => token.children.length !== (token.localName === 'msubsup' ? 3 : 2)).map(token => token.outerHTML))
    expect(invalid).toEqual([])
  }
})
