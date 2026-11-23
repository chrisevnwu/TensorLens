import { useLayoutEffect, useRef, useState, type PointerEvent } from 'react'

/** Narrow charts lay out their axes in CSS pixels. Wide charts retain their intended aspect ratio. */
export function usePlotWidth(designWidth: number) {
  const [svg, setSvg] = useState<SVGSVGElement | null>(null)
  const [width, setWidth] = useState(designWidth)
  useLayoutEffect(() => {
    if (!svg) return
    function measure() {
      const pixels = svg?.getBoundingClientRect().width
      if (pixels) setWidth(Math.min(designWidth, pixels))
    }
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measure)
    observer.observe(svg)
    return () => observer.disconnect()
  }, [svg, designWidth])
  return { ref: setSvg, width }
}

/** A tap or horizontal drag inspects a sample. A vertical finger gesture scrolls the page. */
export function usePlotScrub(onChoose?: (x: number) => void) {
  const gesture = useRef<{ id: number; x: number; y: number; scrubbing: boolean } | null>(null)
  function choose(event: PointerEvent<SVGSVGElement>) {
    const svg = event.currentTarget
    const transform = svg.getScreenCTM()
    if (!transform) return
    const point = svg.createSVGPoint()
    point.x = event.clientX
    point.y = event.clientY
    onChoose?.(point.matrixTransform(transform.inverse()).x)
  }
  return {
    onPointerDown(event: PointerEvent<SVGSVGElement>) {
      if (!onChoose || !event.isPrimary || event.button !== 0) return
      const scrubbing = event.pointerType !== 'touch'
      gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY, scrubbing }
      event.currentTarget.setPointerCapture(event.pointerId)
      if (scrubbing) choose(event)
    },
    onPointerMove(event: PointerEvent<SVGSVGElement>) {
      const active = gesture.current
      if (!active || active.id !== event.pointerId) return
      const dx = Math.abs(event.clientX - active.x)
      const dy = Math.abs(event.clientY - active.y)
      if (dx > 6 && dx > dy) active.scrubbing = true
      if (active.scrubbing) choose(event)
    },
    onPointerUp(event: PointerEvent<SVGSVGElement>) {
      const active = gesture.current
      if (!active || active.id !== event.pointerId) return
      if (active.scrubbing || Math.hypot(event.clientX - active.x, event.clientY - active.y) <= 6) {
        choose(event)
      }
      gesture.current = null
    },
    onLostPointerCapture(event: PointerEvent<SVGSVGElement>) {
      if (gesture.current?.id === event.pointerId) gesture.current = null
    },
  }
}
