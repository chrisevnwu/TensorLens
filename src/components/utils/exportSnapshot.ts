import { readThemePalette } from './useThemePalette'

const svgStyles = [
  'fill','fill-opacity','stroke','stroke-width','stroke-opacity','stroke-dasharray','stroke-dashoffset',
  'stroke-linecap','stroke-linejoin','opacity','color','font-family','font-size','font-weight',
  'letter-spacing','text-anchor','dominant-baseline','visibility','display','stop-color','stop-opacity',
  'paint-order','marker-start','marker-mid','marker-end','clip-path','vector-effect',
]

function snapshotSvg(svg: SVGSVGElement, width: number, height: number) {
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
  const image = new Image()
  image.src = url
  return { image, ready: image.decode().finally(() => URL.revokeObjectURL(url)) }
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

  // Read the whole stage in one turn. Playback or a new selection may change
  // its live SVGs, canvas pixels and text while image decoding is in flight.
  const images: Promise<void>[] = []
  const layers: Array<() => void> = []
  const capture = (el: Element): void => {
    const box = el.getBoundingClientRect()
    const css = getComputedStyle(el)
    if (!box.width || !box.height || css.display === 'none' || css.visibility === 'hidden') return
    const x = box.x - bounds.x, y = box.y - bounds.y
    if (el instanceof SVGSVGElement) {
      const { image, ready } = snapshotSvg(el, box.width, box.height)
      images.push(ready)
      layers.push(() => ctx.drawImage(image, x, y, box.width, box.height))
      return
    }
    if (el instanceof HTMLCanvasElement) {
      const pixels = document.createElement('canvas')
      pixels.width = el.width
      pixels.height = el.height
      const buffer = pixels.getContext('2d')
      if (!buffer) throw new Error('Canvas context unavailable')
      buffer.drawImage(el, 0, 0)
      layers.push(() => ctx.drawImage(pixels, x, y, box.width, box.height))
      return
    }
    const background = css.backgroundColor
    if (background !== 'rgba(0, 0, 0, 0)' && background !== 'transparent') {
      layers.push(() => {
        ctx.fillStyle = background
        ctx.fillRect(x, y, box.width, box.height)
      })
    }
    // Clip descendants to the padding box on each non-visible overflow axis.
    // Nested save/restore pairs preserve the intersection with every ancestor.
    const clipX = css.overflowX !== 'visible'
    const clipY = css.overflowY !== 'visible'
    const clipped = el instanceof HTMLElement && (clipX || clipY)
    if (clipped) {
      const clipLeft = clipX ? x + el.clientLeft : 0
      const clipTop = clipY ? y + el.clientTop : 0
      const clipWidth = clipX ? el.clientWidth : width
      const clipHeight = clipY ? el.clientHeight : height
      layers.push(() => {
        ctx.save()
        ctx.beginPath()
        ctx.rect(clipLeft, clipTop, clipWidth, clipHeight)
        ctx.clip()
      })
    }
    const font = css.fontWeight + ' ' + css.fontSize + ' ' + css.fontFamily
    const color = css.color
    if (el instanceof HTMLSelectElement) {
      const selected = el.selectedOptions[0]?.textContent ?? ''
      const padding = parseFloat(css.paddingLeft) || 0
      layers.push(() => {
        ctx.font = font
        ctx.fillStyle = color
        ctx.fillText(selected, x + padding, y + box.height / 2)
      })
    } else {
      for (const child of el.childNodes) {
        if (child instanceof Element) { capture(child); continue }
        if (child.nodeType !== Node.TEXT_NODE || !child.textContent?.trim()) continue
        const range = document.createRange()
        const glyphs: Array<{ char: string; x: number; y: number }> = []
        let offset = 0
        for (const char of child.textContent) {
          range.setStart(child, offset)
          offset += char.length
          range.setEnd(child, offset)
          const rect = range.getBoundingClientRect()
          if (char.trim() && rect.width) glyphs.push({
            char, x: rect.x - bounds.x, y: rect.y - bounds.y + rect.height / 2,
          })
        }
        layers.push(() => {
          ctx.font = font
          ctx.fillStyle = color
          for (const glyph of glyphs) ctx.fillText(glyph.char, glyph.x, glyph.y)
        })
      }
    }
    if (clipped) layers.push(() => ctx.restore())
  }
  capture(stage)
  await Promise.all(images)
  ctx.textBaseline = 'middle'
  for (const draw of layers) draw()
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
