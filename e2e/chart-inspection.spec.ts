import { expect, test } from './fixture'
import { generateTensor } from '../src/engine/labs/quantization/engine'

test('picks an exact matrix entry and follows the same cell with the keyboard', async ({ page }) => {
  await page.goto('./#/labs/quantization?preset=outlier')
  await page.getByRole('button', { name: '简体中文', exact: true }).click()
  const picker = page.getByRole('group', { name: '检查矩阵单元' })
  await picker.getByRole('combobox', { name: '行', exact: true }).selectOption('12')
  await picker.getByRole('combobox', { name: '列', exact: true }).selectOption('11')
  const tile = page.locator('[data-quant-map=original]')
  const grid = tile.getByRole('grid')
  const cell = grid.getByRole('gridcell', { name: /^\[12, 11\]/ })
  await expect(cell).toHaveCount(1)
  await expect(grid).toHaveAttribute('aria-activedescendant', (await cell.getAttribute('id'))!)
  await expect(tile.locator('.matrix-cell-value')).toHaveText(String(Number(generateTensor(20).get(12,11).toPrecision(5))))
  await grid.press('ArrowRight')
  await expect(picker.getByRole('combobox', { name: '列', exact: true })).toHaveValue('12')
  await grid.press('Control+Home')
  await expect(picker.getByRole('combobox', { name: '行', exact: true })).toHaveValue('0')
  await expect(picker.getByRole('combobox', { name: '列', exact: true })).toHaveValue('0')
})

test('keeps narrow plot axes legible and inspects the sample indicated by a tap or keyboard', async ({ page }, project) => {
  const mobile = project.project.name === 'mobile'
  await page.goto('./#/labs/lora-svd')
  const chart = page.locator('.numeric-chart').getByRole('slider')
  for (const width of [320, 820]) {
    await page.setViewportSize({ width, height: 844 })
    const tick = chart.locator('text').first()
    await expect.poll(() => tick.evaluate(element => {
      const matrix = (element as SVGTextElement).getScreenCTM()!
      return parseFloat(getComputedStyle(element).fontSize) * matrix.a
    })).toBeGreaterThanOrEqual(10.9)
    await chart.scrollIntoViewIfNeeded()
    const middle = await chart.evaluate(element => {
      const svg = element as SVGSVGElement
      const cursor = svg.querySelectorAll('circle')[0]!
      const plot = svg.querySelector('.numeric-grid') as SVGLineElement
      const point = svg.createSVGPoint()
      point.x = (plot.x1.baseVal.value + plot.x2.baseVal.value) / 2
      point.y = cursor.cy.baseVal.value
      const screen = point.matrixTransform(svg.getScreenCTM()!)
      return { x: screen.x, y: screen.y }
    })
    if (mobile) await page.touchscreen.tap(middle.x, middle.y)
    else await page.mouse.click(middle.x, middle.y)
    await expect(chart).toHaveAttribute('aria-valuenow','50')
    await chart.press('ArrowRight')
    await expect(chart).toHaveAttribute('aria-valuetext', /^Optimizer step 51, Adapter MSE [\d.e-]+, SVD floor [\d.e-]+$/)
    await chart.press('Home')
  }
})

test('selects the displayed diffusion time ticks when the plot is letterboxed', async ({ page, context }) => {
  await page.setViewportSize({ width: 1920, height: 900 })
  const schedule = page.locator('.noise-chart').getByRole('slider')
  let releaseWorker!: () => void
  const workerGate = new Promise<void>(resolve => { releaseWorker = resolve })
  await context.route(/\/diffusion\.worker[.-]/, async route => {
    await workerGate
    await route.continue()
  })
  try {
    await page.goto('./#/labs/diffusion-flow?numSteps=40&step=7')
    await expect(page.locator('.wb-stage-surface').getByRole('status')).toBeVisible()
    expect(await schedule.isVisible()).toBe(false)
  } finally {
    releaseWorker()
  }
  await expect(schedule).toHaveAttribute('aria-valuenow', '82.5')
  const horizontalMargin = await schedule.evaluate(element => {
    const svg = element as SVGSVGElement
    const rect = svg.getBoundingClientRect()
    const view = svg.viewBox.baseVal
    return (rect.width - rect.height * view.width / view.height) / 2
  })
  expect(horizontalMargin).toBeGreaterThan(100)
  for (const time of [25, 0, 75, 100, 50]) {
    const tick = schedule.locator('text[y="125"]').filter({ hasText: new RegExp('^' + time + '$') })
    await tick.click()
    await expect(schedule).toHaveAttribute('aria-valuenow', String(time))
  }
})
