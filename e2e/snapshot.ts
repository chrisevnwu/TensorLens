import { readFile } from 'node:fs/promises'
import { expect, type Locator, type Page } from '@playwright/test'

export async function expectStageSnapshot(page: Page, button: Locator, labId: string) {
  await expect(button).toBeEnabled()
  await page.evaluate(() => document.fonts.ready.then(() => undefined))
  await button.scrollIntoViewIfNeeded()
  // Read the DOM dimensions at activation. Font metrics or a worker result can
  // change the stage between Playwright's actionability checks and the click.
  const measurement = await button.evaluateHandle(el => {
    const size = { width: 0, height: 0 }
    el.addEventListener('click', () => {
      const stage = document.querySelector('.wb-stage-surface')!.getBoundingClientRect()
      size.width = stage.width
      size.height = stage.height
    }, { capture: true, once: true })
    return size
  })
  const pending = page.waitForEvent('download')
  await button.click()
  const download = await pending
  const stage = await measurement.jsonValue()
  await measurement.dispose()
  expect(stage.width).toBeGreaterThan(0)
  expect(stage.height).toBeGreaterThan(0)
  expect(download.suggestedFilename()).toBe(labId + '-snapshot.png')
  const file = await download.path()
  expect(file).toBeTruthy()
  const bytes = await readFile(file!)
  expect(bytes.subarray(0,8)).toEqual(Buffer.from([137,80,78,71,13,10,26,10]))
  expect(bytes.readUInt32BE(16)).toBe(2 * Math.ceil(stage.width))
  // The screenshot adds a 42 CSS-pixel caption underneath the stage.
  expect(bytes.readUInt32BE(20)).toBe(2 * (Math.ceil(stage.height) + 42))
  const distinctColors = await page.evaluate(async encoded => {
    const image = new Image()
    image.src = 'data:image/png;base64,' + encoded
    await image.decode()
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 48
    const ctx = canvas.getContext('2d')!
    // Sample the stage only. A successful download containing just a title must fail.
    ctx.drawImage(image, 0,0,image.width,image.height - 84, 0,0,48,48)
    return new Set(new Uint32Array(ctx.getImageData(0,0,48,48).data.buffer)).size
  }, bytes.toString('base64'))
  expect(distinctColors).toBeGreaterThan(8)
}
