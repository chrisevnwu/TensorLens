import { readFile } from 'node:fs/promises'
import { expect, expectNoOverflow, test } from './fixture'
import { LAB_REGISTRY } from '../src/labs/registry'
import { workbenchCopy } from '../src/i18n/workbench'

for (const locale of ['en','zh'] as const) {
  for (const theme of ['dark','light'] as const) {
    test.describe(locale + ' / ' + theme, () => {
      for (const lab of LAB_REGISTRY) {
        test(lab.id + ' restores a nondefault experiment and exports a 2× PNG', async ({ page, context }) => {
          await context.grantPermissions(['clipboard-read','clipboard-write'])
          await page.emulateMedia({ colorScheme:theme, reducedMotion:'reduce' })
          const t = workbenchCopy[locale]
          await page.goto('./#/labs/' + lab.id)
          if (locale === 'zh') await page.getByRole('button', { name:'简体中文', exact:true }).click()

          async function expectAppearance() {
            await expect(page.locator('html')).toHaveAttribute('lang', locale === 'zh' ? 'zh-CN' : 'en')
            await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
            await expect(page.getByRole('heading', { level:1, name:lab.title[locale], exact:true })).toBeVisible()
            await expect(page.getByRole('region', { name:t.stage, exact:true })).toBeVisible()
          }
          await expectAppearance()
          await expectNoOverflow(page)
          const presets = page.getByRole('group', { name:t.presets, exact:true })
          const inactive = presets.getByRole('button', { pressed:false }).first()
          const selectedName = await inactive.innerText()
          await inactive.click()
          const selected = presets.getByRole('button', { name:selectedName, exact:true })
          await expect(selected).toHaveAttribute('aria-pressed','true')
          const playhead = page.getByRole('group', { name:t.playback }).getByRole('slider')
          await playhead.press('Home')
          await page.getByRole('button', { name:t.next, exact:true }).click()
          await expect(playhead).toHaveValue('1')

          await page.getByRole('button', { name:t.share, exact:true }).click()
          await expect(page.getByRole('status').filter({ hasText:t.copied })).toBeVisible()
          const shared = new URL(await page.evaluate(() => navigator.clipboard.readText()))
          expect(shared.origin).toBe(new URL(page.url()).origin)
          const [route,query] = shared.hash.split('?')
          expect(route).toBe('#/labs/' + lab.id)
          expect(new URLSearchParams(query).get('preset')).toBeTruthy()

          await page.goto('about:blank')
          await page.goto(shared.href)
          await expectAppearance()
          await expect(selected).toHaveAttribute('aria-pressed','true')
          await expect(playhead).toHaveValue('1')
          const exportButton = page.getByRole('button', { name:t.export, exact:true })
          await expect(exportButton).toBeEnabled()
          await page.evaluate(() => document.fonts.ready.then(() => undefined))
          await expectNoOverflow(page)
          await exportButton.scrollIntoViewIfNeeded()
          const bounds = await page.locator('.wb-stage-surface').boundingBox()
          expect(bounds).toBeTruthy()
          const pendingDownload = page.waitForEvent('download')
          await exportButton.click()
          const download = await pendingDownload
          expect(download.suggestedFilename()).toBe(lab.id + '-snapshot.png')
          const file = await download.path()
          expect(file).toBeTruthy()
          const bytes = await readFile(file!)
          expect(bytes.subarray(0,8)).toEqual(Buffer.from([137,80,78,71,13,10,26,10]))
          expect(bytes.readUInt32BE(16)).toBe(2 * Math.ceil(bounds!.width))
          // The exported canvas adds a 42 CSS-pixel caption below the workbench.
          expect(bytes.readUInt32BE(20)).toBe(2 * (Math.ceil(bounds!.height) + 42))
          const distinctColors = await page.evaluate(async encoded => {
            const data = Uint8Array.from(atob(encoded), c => c.charCodeAt(0))
            const image = await createImageBitmap(new Blob([data], { type:'image/png' }))
            const ctx = new OffscreenCanvas(48,48).getContext('2d')!
            // Exclude the caption so a titled but otherwise empty snapshot fails.
            ctx.drawImage(image, 0,0,image.width,image.height - 84, 0,0,48,48)
            image.close()
            return new Set(new Uint32Array(ctx.getImageData(0,0,48,48).data.buffer)).size
          }, bytes.toString('base64'))
          expect(distinctColors).toBeGreaterThan(8)
        })
      }
    })
  }
}
