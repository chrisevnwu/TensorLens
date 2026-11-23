import { expect, test } from './fixture'
import { retrievalCopy } from '../src/i18n/labs/hybrid-retrieval'
import { workbenchCopy } from '../src/i18n/workbench'

test('retrieves an exact code, recalls a paraphrase and promotes the shared runner-up', async ({ page, context }, info) => {
  const mobile = info.project.name === 'mobile'
  const locale = mobile ? 'zh' : 'en'
  const t = retrievalCopy[locale], shell = workbenchCopy[locale]
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('./#/labs/hybrid-retrieval')
  if (mobile) await page.getByRole('button', { name: '简体中文' }).click()
  async function panel(id: 'controls' | 'challenges') {
    if (mobile) await page.locator('#tab-' + id).click()
  }
  const board = page.locator('.retrieval-board')
  const top = (method: string) => board.locator('[data-ranking="' + method + '"] button').first()
  const presets = page.getByRole('group', { name: shell.presets, exact: true })
  const cutoff = page.getByRole('slider', { name: t.cutoff, exact: true })
  await panel('controls')
  await cutoff.press('Home')
  await top('bm25').click()
  await expect(top('bm25')).toHaveAttribute('data-doc', 'D01')

  await presets.getByRole('button', { name: t.presets.synonym, exact: true }).click()
  await expect(board.locator('[data-ranking=bm25]')).toHaveText(t.absent)
  await top('cosine').click()
  await expect(top('cosine')).toHaveAttribute('data-doc', 'D04')
  await expect(board.locator('[data-ranking=cosine] button').nth(1)).toHaveAttribute('data-doc', 'D05')

  await presets.getByRole('button', { name: t.presets.mixed, exact: true }).click()
  await cutoff.press('Home')
  await expect(top('bm25')).toHaveAttribute('data-doc', 'D01')
  await expect(top('cosine')).toHaveAttribute('data-doc', 'D03')
  await expect(top('rrf')).toHaveAttribute('data-doc', 'D02')
  await top('rrf').click()
  const fused = page.locator('.retrieval-readout [data-score=rrf]')
  // Two independent rank-2 votes at c=60 give 2/62.
  await expect(fused).toHaveText('0.0323')
  await panel('challenges')
  await expect(page.locator('#wb-challenges li')).toHaveCount(3)
  for (const item of await page.locator('#wb-challenges li').all()) {
    await expect(item).toHaveAttribute('data-complete', 'true')
  }
  await panel('controls')
  await page.getByRole('slider', { name: t.constant, exact: true }).press('Home')
  await expect(fused).toHaveText('1.0000')
  await expect(top('rrf')).toHaveAttribute('data-doc', 'D01')
  const battery = page.getByRole('slider', { name: mobile ? '查询中的电池权重' : 'Battery weight in query', exact: true })
  await battery.press('Home')
  await expect(top('cosine')).toHaveAttribute('data-doc', 'D01')
  await expect(top('bm25')).toHaveAttribute('data-doc', 'D01')
  await page.getByRole('button', { name: shell.share, exact: true }).click()
  await expect(page.getByRole('status').filter({ hasText: shell.copied })).toBeVisible()
  const shared = await page.evaluate(() => navigator.clipboard.readText())
  await page.goto('about:blank')
  await page.goto(shared)
  await expect(battery).toHaveValue('0')
  await expect(top('cosine')).toHaveAttribute('data-doc', 'D01')
  await expect(page.locator('.wb-stepper input[type=range]')).toHaveValue('2')
  await expect(page.locator('.retrieval-readout')).toHaveAttribute('data-selected-document', 'D02')
})
