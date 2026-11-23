import { expect, test } from './fixture'
import { attentionCopy } from '../src/i18n/labs/attention-debugger'
import { ATTENTION_PRESETS } from '../src/engine/labs/attention-debugger/presets'
import { inspectCell, simulateAttention } from '../src/engine/labs/attention-debugger/engine'

test('removes future attention without changing its raw projection, then shares the KV heads', async ({ page }, testInfo) => {
  const mobile = testInfo.project.name === 'mobile'
  const text = attentionCopy[mobile ? 'zh' : 'en']
  await page.goto('/#/labs/attention-debugger?step=4')
  if (mobile) await page.getByRole('button', { name: '简体中文' }).click()
  async function panel(name: 'controls' | 'inspector' | 'challenges') {
    if (mobile) await page.locator(`#tab-${name}`).click()
  }
  const parameters = page.locator('.head-wiring h2 small')
  await expect(parameters).toContainText('288')
  const masks = page.getByRole('group', { name: text.mask, exact: true })
  await panel('controls')
  await masks.getByRole('button', { name: text.maskTypes.bidirectional, exact: true }).click()
  const future = page.locator('.attention-overview .matrix-heatmap rect[data-row="0"][data-col="1"]')
  await future.click()
  await panel('inspector')
  const raw = page.locator('#wb-inspector [data-readout="raw"]')
  const weight = page.locator('#wb-inspector [data-readout="weight"]')
  await expect(weight).toBeVisible()
  const expected = inspectCell(simulateAttention({ ...ATTENTION_PRESETS[0], maskType: 'bidirectional' }), 0, 0, 1)
  const unmasked = await raw.innerText()
  expect(Number(unmasked)).toBeCloseTo(expected.rawScore, 3)
  expect(Number(await weight.innerText())).toBeCloseTo(expected.weight, 3)
  expect(Number(await weight.innerText())).toBeGreaterThan(0)
  await panel('controls')
  await masks.getByRole('button', { name: text.maskTypes.causal, exact: true }).click()
  await future.click()
  await panel('inspector')
  await expect(raw).toHaveText(unmasked)
  await expect(weight).toHaveText(/^0(?:\.0+)?$/)
  await panel('challenges')
  await expect(page.locator('#wb-challenges li').nth(1)).toHaveAttribute('data-complete', 'true')
  await panel('controls')
  await page.getByRole('group', { name: text.topology, exact: true }).getByRole('button', { name: 'GQA', exact: true }).click()
  await panel('inspector')
  await expect(parameters).toContainText('144')
  const sharing = page.locator('.metric-card').filter({ has: page.getByText(text.sharing, { exact: true }) })
  await expect(sharing.locator('output')).toHaveText(/^2(?:\.0+)?\s*(?:×|:1)$/)
  await panel('challenges')
  await expect(page.locator('#wb-challenges li').nth(2)).toHaveAttribute('data-complete', 'true')
})

test('keeps edited long tokens intact across arc selection and a shared link', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'clipboard', { value: undefined }))
  await page.goto('./#/labs/attention-debugger')
  const tokens = Array.from({ length: 6 }, (_, i) => String(i).padEnd(64, '数'))
  const tokenInputs = page.locator('.attention-input-chips input')
  for (const [i, token] of tokens.entries()) await tokenInputs.nth(i).fill(token)
  const text = page.locator('textarea[name="tokens"]')
  await expect(text).toHaveValue(tokens.join(' '))

  const query = page.getByRole('button', { name: 'Query 4: ' + tokens[4], exact: true })
  await query.press('Enter')
  await expect(query).toHaveAttribute('aria-pressed', 'true')
  await expect(query).toHaveAttribute('title', tokens[4]!)
  await expect(query).toHaveCSS('text-overflow', 'ellipsis')
  expect(await query.evaluate(button => button.scrollWidth > button.clientWidth)).toBe(true)

  await page.getByRole('button', { name: 'Share URL', exact: true }).click()
  const shared = await page.getByRole('textbox', { name: 'Share URL', exact: true }).inputValue()
  await page.goto('about:blank')
  await page.goto(shared)
  await expect(text).toHaveValue(tokens.join(' '))
  await expect(query).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('.attention-inspector .attention-pair')).toContainText('q[4] ' + tokens[4])
})
