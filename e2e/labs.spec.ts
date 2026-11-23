import { readFile } from 'node:fs/promises'
import { expect, test } from './fixture'
import { LAB_REGISTRY } from '../src/labs/registry'
import { workbenchCopy } from '../src/i18n/workbench'

// The registry is the source of truth for every production route.
for (const lab of LAB_REGISTRY.filter(entry => entry.component)) {
  test(lab.id + ' steps, restores shared state and downloads a PNG', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read','clipboard-write'])
    const t = workbenchCopy.en
    await page.goto('./#/labs/' + lab.id + '?step=0')
    const stage = page.getByRole('region', { name:t.stage, exact:true })
    await expect(page.getByRole('heading', { level:1, name:lab.title.en })).toBeVisible()
    await expect(stage).toBeVisible()
    const next = page.getByRole('button', { name:t.next, exact:true })
    await next.click()
    const stepper = page.getByRole('group', {name:t.playback})
    const progressed = await stepper.locator('input[type=range]').inputValue()
    expect(Number(progressed)).toBeGreaterThan(0)
    await page.getByRole('button', {name:t.share,exact:true}).click()
    await expect(page.getByRole('status').filter({hasText:t.copied})).toBeVisible()
    const shared = await page.evaluate(() => navigator.clipboard.readText())
    expect(shared).toContain('/#/labs/' + lab.id + '?')
    await page.goto('about:blank')
    await page.goto(shared)
    await expect(stepper.locator('input[type=range]')).toHaveValue(progressed)
    const downloaded = page.waitForEvent('download')
    await page.getByRole('button', {name:t.export,exact:true}).click()
    const download = await downloaded
    expect(download.suggestedFilename()).toBe(lab.id + '-snapshot.png')
    const file = await download.path()
    expect(file).toBeTruthy()
    const bytes = await readFile(file!)
    expect(bytes.subarray(1,4).toString()).toBe('PNG')
    expect(bytes.readUInt32BE(16)).toBeGreaterThan(200)
    expect(bytes.readUInt32BE(20)).toBeGreaterThan(100)
  })
}
