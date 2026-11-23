import { expect, test } from './fixture'
import { diffusionCopy } from '../src/i18n/labs/diffusion-flow'
import { workbenchCopy } from '../src/i18n/workbench'

test('compares three trajectories from matched noise, scrubs the score field and guides particles to class A', async ({ page }, testInfo) => {
  const mobile = testInfo.project.name === 'mobile'
  const locale = mobile ? 'zh' : 'en'
  const t = diffusionCopy[locale]
  await page.goto('/#/labs/diffusion-flow?preset=compare&sampler=compare&numSteps=10&step=0')
  if (mobile) await page.getByRole('button', { name: '简体中文' }).click()
  async function panel(name: 'controls' | 'challenges') {
    if (mobile) await page.locator(`#tab-${name}`).click()
  }
  const solver = (id: string) => page.locator(`figure[data-solver="${id}"]`)
  async function metric(id: string, key: string) {
    const raw = await solver(id).getAttribute('data-' + key)
    expect(raw).toBeTruthy()
    return Number(raw)
  }
  const canvases = page.locator('figure[data-solver] canvas')
  await expect(canvases).toHaveCount(3)
  const playhead = page.locator('.wb-stepper input[type="range"]')
  await expect(playhead).toHaveAttribute('max', '10')
  const initialDistance = await metric('ddim', 'mean-distance')
  expect(initialDistance).toBeGreaterThan(0)
  const x = await metric('ddim','x'), y = await metric('ddim','y')
  for (const id of ['ddpm','ddim','flow']) {
    await expect(solver(id)).toHaveAttribute('data-particle-count','120')
    expect(await metric(id,'x')).toBe(x)
    expect(await metric(id,'y')).toBe(y)
    expect(await metric(id,'mean-distance')).toBe(initialDistance)
  }
  await panel('controls')
  const quiver = page.getByRole('switch', { name: t.showVectorField, exact: true })
  await quiver.uncheck()
  await expect(solver('ddim')).toHaveAttribute('data-field-count','0')
  await quiver.check()
  await expect(solver('ddim')).toHaveAttribute('data-field-count','256')
  await playhead.press('End')
  await expect(solver('ddim')).toHaveAttribute('data-time','0')
  await expect(solver('flow')).toHaveAttribute('data-time','1')
  expect(await metric('ddim','mean-distance')).toBeLessThan(initialDistance * .3)
  expect(await metric('flow','mean-distance')).toBeLessThan(initialDistance * .3)
  expect(await metric('flow','straightness')).toBeLessThan(await metric('ddpm','straightness'))
  await panel('challenges')
  const missions = page.locator('#wb-challenges li')
  await expect(missions.nth(1)).toHaveAttribute('data-complete','true')
  await expect(missions.nth(2)).toHaveAttribute('data-complete','true')

  await panel('controls')
  await page.getByRole('group', { name: workbenchCopy[locale].presets, exact:true })
    .getByRole('button', { name:t.presets.guidance, exact:true }).click()
  await expect(canvases).toHaveCount(1)
  await expect(solver('ddim')).toHaveAttribute('data-time','1')
  const initialPurity = await metric('ddim','purity-a')
  expect(initialPurity).toBeLessThan(.9)
  await playhead.press('End')
  await expect(solver('ddim')).toHaveAttribute('data-time','0')
  expect(await metric('ddim','purity-a')).toBeGreaterThanOrEqual(.9)
  await panel('challenges')
  for (const i of [0,1,2]) await expect(missions.nth(i)).toHaveAttribute('data-complete','true')
  await page.reload()
  await panel('challenges')
  for (const i of [0,1,2]) await expect(missions.nth(i)).toHaveAttribute('data-complete','true')
})
