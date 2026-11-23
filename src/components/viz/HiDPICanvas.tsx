import { useLayoutEffect, useRef, type CanvasHTMLAttributes } from 'react'
import { useThemePalette, type ThemePalette } from '../utils/useThemePalette'

export interface CanvasFrame { width: number; height: number; dpr: number; palette: ThemePalette }
interface Props extends Omit<CanvasHTMLAttributes<HTMLCanvasElement>, 'onChange'> {
  onRender: (ctx: CanvasRenderingContext2D, size: CanvasFrame) => void
  label: string
}
export function HiDPICanvas({ onRender, label, ...props }: Props) {
  const ref = useRef<HTMLCanvasElement>(null)
  const palette = useThemePalette()
  const render = useRef(onRender)
  const draw = useRef<() => void>(() => {})
  useLayoutEffect(() => { render.current = onRender; draw.current() }, [onRender])
  useLayoutEffect(() => {
    const canvas = ref.current
    if (!canvas || typeof ResizeObserver === 'undefined') return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    draw.current = () => {
      const { width, height } = canvas.getBoundingClientRect()
      if (!width || !height) return
      const dpr = window.devicePixelRatio || 1
      const w = Math.round(width * dpr), h = Math.round(height * dpr)
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, width, height)
      ctx.save()
      try { render.current(ctx, { width, height, dpr, palette }) } finally { ctx.restore() }
    }
    const observer = new ResizeObserver(() => draw.current())
    observer.observe(canvas)
    window.addEventListener('resize', draw.current)
    draw.current()
    return () => { observer.disconnect(); window.removeEventListener('resize', draw.current); draw.current = () => {} }
  }, [palette])
  return <canvas {...props} ref={ref} role="img" aria-label={label} style={{ display:'block', width:'100%', height:300, ...props.style }} />
}
