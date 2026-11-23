import { readFile } from 'node:fs/promises'
import { expect, test } from './fixture'

for (const [lab, selector, key] of [
  ['diffusion-flow', '.diffusion-choice input', 'particle'],
  ['norm-residual', '.norm-inspector select', 'channel'],
  ['flash-attention', '.flash-io [role=slider]', 'scalingLength'],
  ['kv-cache-profiler', '.kv-roof [role=slider]', 'probeAI'],
] as const) {
  test(lab + ' shares the active inspection and restores its preset on reset', async ({ page, context }, info) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.goto('./#/labs/' + lab + '?step=2')
    async function reveal() {
      if (lab === 'norm-residual' && info.project.name === 'mobile') await page.getByRole('tab', { name: 'Inspector & math' }).click()
    }
    await reveal()
    const control = page.locator(selector)
    function read() {
      return lab === 'diffusion-flow' || lab === 'norm-residual' ? control.inputValue() : control.getAttribute('aria-valuetext')
    }
    await expect(control).toBeVisible()
    if (lab === 'norm-residual') await expect(control).toHaveValue('0')
    const initial = await read()
    if (lab === 'norm-residual') await control.selectOption('17')
    else await control.press('End')
    const selected = await read()
    expect(selected).not.toBe(initial)
    await page.getByRole('button', { name: 'Share URL', exact: true }).click()
    const shared = await page.evaluate(() => navigator.clipboard.readText())
    expect(new URLSearchParams(shared.split('?')[1]).has(key)).toBe(true)
    await page.goto('about:blank')
    await page.goto(shared)
    await reveal()
    await expect.poll(read).toBe(selected)
    await page.getByRole('button', { name: 'Reset', exact: true }).click()
    await expect.poll(read).toBe(initial)
  })
}

test('manual stepping pauses playback and holds the inspected frame', async ({ page }) => {
  await page.clock.install()
  await page.goto('./#/labs/flash-attention?step=3')
  const transport = page.getByRole('group', { name: 'Playback' })
  await transport.getByRole('button', { name: 'Play', exact: true }).click()
  await transport.getByRole('button', { name: 'Next step', exact: true }).click()
  await expect(transport.getByRole('button', { name: 'Play', exact: true })).toBeVisible()
  const step = await transport.getByRole('slider').inputValue()
  await page.clock.runFor(1000)
  await expect(transport.getByRole('slider')).toHaveValue(step)
})

test('inspecting a training chart holds the chosen optimizer step until replay', async ({ page }) => {
  await page.clock.install()
  await page.goto('./#/labs/lora-svd?step=5')
  const transport = page.getByRole('group', { name: 'Playback' })
  const chart = page.locator('.numeric-chart').getByRole('slider')
  await transport.getByRole('button', { name: 'Play', exact: true }).click()
  await chart.press('Home')
  await expect(transport.getByRole('button', { name: 'Play', exact: true })).toBeVisible()
  await page.clock.runFor(1000)
  await expect(chart).toHaveAttribute('aria-valuenow', '0')
  await transport.getByRole('button', { name: 'Play', exact: true }).click()
  await page.clock.runFor(800)
  await expect.poll(async () => Number(await chart.getAttribute('aria-valuenow'))).toBeGreaterThan(0)
})

type Matrices = Record<string, string>
declare global {
  interface Window {
    frameProbe: {
      start: Matrices
      live: () => Matrices
      pending: () => number
      release: () => void
      exported: () => Promise<Matrices>
    }
  }
}

test('slow image decoding preserves every LoRA heatmap at the instant of export', async ({ page }) => {
  await page.clock.install()
  await page.goto('./#/labs/lora-svd?preset=stress&step=0')
  const transport = page.getByRole('group', { name: 'Playback' })
  const button = page.getByRole('button', { name: 'Export PNG', exact: true })
  await expect(button).toBeEnabled()
  await button.evaluate(buttonElement => {
    const blobs: Blob[] = []
    const capture = (matrix: Element) => [matrix.getAttribute('aria-label')!,
      Array.from(matrix.querySelectorAll('[data-row] title'), title => title.textContent).join('|')]
    const live = () => Object.fromEntries(Array.from(document.querySelectorAll('.lora-stage .matrix-heatmap'), capture))
    const createURL = URL.createObjectURL.bind(URL)
    URL.createObjectURL = data => {
      if (data instanceof Blob && data.type.startsWith('image/svg+xml')) blobs.push(data)
      return createURL(data)
    }
    let release!: () => void
    const hold = new Promise<void>(resolve => { release = resolve })
    const decode = HTMLImageElement.prototype.decode
    HTMLImageElement.prototype.decode = async function () {
      if (this.src.startsWith('blob:')) await hold
      return decode.call(this)
    }
    window.frameProbe = {
      start: {}, live, release, pending: () => blobs.length,
      exported: async () => {
        const matrices = []
        for (const blob of blobs) {
          const svg = new DOMParser().parseFromString(await blob.text(), 'image/svg+xml').documentElement
          if (svg.classList.contains('matrix-heatmap')) matrices.push(capture(svg))
        }
        return Object.fromEntries(matrices)
      },
    }
    buttonElement.addEventListener('click', () => { window.frameProbe.start = live() }, { capture:true, once:true })
  })
  await transport.getByRole('button', { name: 'Play', exact: true }).click()
  const downloading = page.waitForEvent('download')
  await button.click()
  await expect.poll(() => page.evaluate(() => window.frameProbe.pending())).toBeGreaterThan(0)
  await page.clock.runFor(1500)
  const changes = await page.evaluate(() => {
    const after = window.frameProbe.live()
    return Object.keys(after).filter(label => after[label] !== window.frameProbe.start[label])
  })
  // A moving playhead alone cannot prove that the exported matrix values were frozen.
  expect(changes.length).toBeGreaterThanOrEqual(3)
  await page.evaluate(() => window.frameProbe.release())
  expect((await downloading).suggestedFilename()).toBe('lora-svd-snapshot.png')
  const actual = await page.evaluate(() => window.frameProbe.exported())
  expect(actual).toEqual(await page.evaluate(() => window.frameProbe.start))
})

test('exports only the on-screen portion of a scrolled BPE token stream', async ({ page }) => {
  const prompt = 'aB12'.repeat(140)
  await page.goto('./#/labs/bpe-tokenizer?step=0&prompt=' + prompt)
  const strip = page.locator('.bpe-tokens')
  await expect(strip.locator('button')).toHaveCount(prompt.length)
  // Identify real token pixels independently of the current theme or neighboring plots.
  await page.addStyleTag({ content: '.bpe-chip { background: rgb(246, 9, 101) !important; }' })
  const bounds = await strip.evaluate(el => {
    el.scrollTop = (el.scrollHeight - el.clientHeight) / 2
    const stage = el.closest('.wb-stage-surface')!.getBoundingClientRect()
    const box = el.getBoundingClientRect()
    return { offset: el.scrollTop, top: 2 * (box.top-stage.top), bottom: 2 * (box.bottom-stage.top) }
  })
  expect(bounds.offset).toBeGreaterThan(50)
  const downloading = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export PNG', exact:true }).click()
  const bytes = await readFile((await (await downloading).path())!)
  const counts = await page.evaluate(async ({ encoded, top, bottom }) => {
    const image = new Image()
    image.src = 'data:image/png;base64,' + encoded
    await image.decode()
    const canvas = document.createElement('canvas')
    canvas.width = image.width
    canvas.height = image.height
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(image, 0, 0)
    const pixels = ctx.getImageData(0,0,canvas.width,canvas.height).data
    let inside = 0, outside = 0
    for (let i = 0; i < pixels.length; i += 4) {
      if (pixels[i] !== 246 || pixels[i+1] !== 9 || pixels[i+2] !== 101) continue
      const y = Math.floor(i / 4 / canvas.width)
      if (y < Math.floor(top) || y >= Math.ceil(bottom)) outside++
      else inside++
    }
    return { inside, outside }
  }, { ...bounds, encoded: bytes.toString('base64') })
  expect(counts.inside).toBeGreaterThan(1000)
  expect(counts.outside).toBe(0)
})
