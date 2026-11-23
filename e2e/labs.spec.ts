import { expectStageSnapshot } from './snapshot'
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
          await expectNoOverflow(page)
          await expectStageSnapshot(page, page.getByRole('button', { name: t.export, exact: true }), lab.id)
        })
      }
    })
  }
}
