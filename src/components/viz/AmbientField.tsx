import { useEffect, useRef } from 'react'
import { knotVertices, projectKnot, rings, strands } from '../../engine/ambient'
import { useAppStore } from '../../store/useAppStore'

const vertices = knotVertices()

export default function AmbientField() {
  const ref = useRef<HTMLCanvasElement>(null)
  const theme = useAppStore(state => state.theme)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas || typeof ResizeObserver === 'undefined') return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const points = new Float64Array(vertices.length)
    const style = getComputedStyle(document.documentElement)
    const colors = ['--accent-primary', '--accent-secondary', '--accent-tertiary'].map(key => style.getPropertyValue(key).trim())
    const media = matchMedia('(prefers-reduced-motion: reduce)')
    let width = 0, height = 0, elapsed = 0, last = 0, frame = 0, cursor = 0
    let visible = true
    function render(time: number) {
      if (!canvas || !ctx) return
      cancelAnimationFrame(frame)
      const animated = !media.matches && !document.hidden && visible
      if (last && animated) elapsed += Math.min(time - last, 45)
      last = time
      ctx.clearRect(0, 0, width, height)
      const scale = Math.min(width / 3.85, height / 3.25)
      projectKnot(vertices, points, -0.55 + elapsed * 0.000075 + cursor * 0.15, 0.89)
      const position = (i: number) => [width * 0.5 + points[i]! * scale, height * 0.50 + points[i+1]! * scale] as const
      for (let ring = 0; ring < rings; ring++) {
        ctx.strokeStyle = colors[Math.floor(ring * 3 / rings)]!
        ctx.lineWidth = 0.8
        ctx.globalAlpha = Math.min(0.9, Math.max(0.14, (points[ring * strands * 3+2]! + 2) / 4))
        ctx.beginPath()
        for (let strand = 0; strand < strands; strand++) {
          const i = (ring * strands + strand) * 3
          ctx.moveTo(...position(i))
          ctx.lineTo(...position(((ring + 1) % rings * strands + strand) * 3))
          if (ring % 3 === 0) {
            ctx.moveTo(...position(i))
            ctx.lineTo(...position((ring * strands + (strand + 1) % strands) * 3))
          }
        }
        ctx.stroke()
      }
      ctx.globalAlpha = 1
      if (animated) frame = requestAnimationFrame(render)
    }
    function resize() {
      if (!canvas || !ctx) return
      const box = canvas.getBoundingClientRect()
      width = box.width
      height = box.height
      const dpr = window.devicePixelRatio || 1
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      render(performance.now())
    }
    const refresh = () => { last = 0; render(performance.now()) }
    const move = (event: PointerEvent) => { cursor = event.offsetX / Math.max(width, 1) - 0.5 }
    const observer = new ResizeObserver(resize)
    const intersection = new IntersectionObserver(([entry]) => { visible = Boolean(entry?.isIntersecting); refresh() })
    observer.observe(canvas)
    intersection.observe(canvas)
    media.addEventListener('change', refresh)
    document.addEventListener('visibilitychange', refresh)
    canvas.addEventListener('pointermove', move)
    resize()
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      intersection.disconnect()
      media.removeEventListener('change', refresh)
      document.removeEventListener('visibilitychange', refresh)
      canvas.removeEventListener('pointermove', move)
    }
  }, [theme])
  return <canvas ref={ref} className="ambient-field" aria-hidden="true" />
}
