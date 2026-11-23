import { readThemePalette } from './useThemePalette'

const svgStyles = [
  'fill','fill-opacity','stroke','stroke-width','stroke-opacity','stroke-dasharray','stroke-dashoffset',
  'stroke-linecap','stroke-linejoin','opacity','color','font-family','font-size','font-weight',
  'letter-spacing','text-anchor','dominant-baseline','visibility','display','stop-color','stop-opacity',
  'paint-order','marker-start','marker-mid','marker-end','clip-path','vector-effect',
]

async function rasterizeSvg(svg: SVGSVGElement, width: number, height: number) {
  const clone = svg.cloneNode(true) as SVGSVGElement
  const originals = [svg, ...svg.querySelectorAll('*')]
  const copies = [clone, ...clone.querySelectorAll('*')]
  originals.forEach((el, i) => {
    const copy = copies[i]
    if (!(copy instanceof SVGElement)) return
    const css = getComputedStyle(el)
    for (const property of svgStyles) {
      const value = css.getPropertyValue(property).replace(/url\(["']?[^("#]*#([^)"']+)["']?\)/g, 'url(#$1)')
      copy.style.setProperty(property, value)
    }
  })
  clone.setAttribute('width', String(width * 2))
  clone.setAttribute('height', String(height * 2))
  if (!svg.hasAttribute('viewBox')) clone.setAttribute('viewBox', '0 0 ' + width + ' ' + height)
  const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(clone)], {type:'image/svg+xml;charset=utf-8'}))
  try {
    const image = new Image()
    image.src = url
    await image.decode()
    return image
  } finally { URL.revokeObjectURL(url) }
}

// Keep the actual on-screen relative positions, including synchronized panels.
export async function exportSnapshot(stage: HTMLElement, labId: string, title: string) {
  const bounds = stage.getBoundingClientRect()
  const width = Math.ceil(bounds.width), height = Math.ceil(bounds.height)
  if (!width || !height) throw new Error('Empty stage')
  const palette = readThemePalette()
  const result = document.createElement('canvas')
  result.width = width * 2
  result.height = (height + 42) * 2
  const ctx = result.getContext('2d')
  if (!ctx) throw new Error('Canvas context unavailable')
  ctx.scale(2, 2)
  ctx.fillStyle = palette.canvas
  ctx.fillRect(0, 0, width, height + 42)

  async function paint(el: Element) {
    const box = el.getBoundingClientRect()
    const css = getComputedStyle(el)
    if (!box.width || !box.height || css.display === 'none' || css.visibility === 'hidden') return
    const x = box.x - bounds.x, y = box.y - bounds.y
    if (el instanceof SVGSVGElement || el instanceof HTMLCanvasElement) {
      const image = el instanceof SVGSVGElement ? await rasterizeSvg(el, box.width, box.height) : el
      ctx!.drawImage(image, x, y, box.width, box.height)
      return
    }
    ctx!.fillStyle = css.backgroundColor
    ctx!.fillRect(x, y, box.width, box.height)
    for (const child of el.childNodes) {
      if (child instanceof Element) { await paint(child); continue }
      if (child.nodeType !== Node.TEXT_NODE || !child.textContent?.trim()) continue
      const range = document.createRange()
      // Use browser text layout, including wraps and mixed CJK / Latin lines.
      let offset = 0
      for (const char of child.textContent) {
        range.setStart(child, offset)
        offset += char.length
        range.setEnd(child, offset)
        const rect = range.getBoundingClientRect()
        if (!char.trim() || !rect.width) continue
        ctx!.font = css.fontWeight + ' ' + css.fontSize + ' ' + css.fontFamily
        ctx!.fillStyle = css.color
        ctx!.textBaseline = 'middle'
        ctx!.fillText(char, rect.x - bounds.x, rect.y - bounds.y + rect.height / 2)
      }
    }
  }
  await paint(stage)
  ctx.fillStyle = palette.surface
  ctx.fillRect(0, height, width, 42)
  ctx.fillStyle = palette.muted
  ctx.font = '13px system-ui'
  ctx.textBaseline = 'middle'
  ctx.fillText('TensorLens · ' + title, 12, height + 21, Math.max(1, width - 24))
  const blob = await new Promise<Blob>((resolve, reject) => result.toBlob(
    file => file ? resolve(file) : reject(new Error('PNG encoding failed')), 'image/png'))
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = labId + '-snapshot.png'
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
