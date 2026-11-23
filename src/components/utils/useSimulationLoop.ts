import { useEffect, useLayoutEffect, useRef } from 'react'

export function useSimulationLoop(tick: () => void, playing: boolean, intervalMs: number) {
  const callback = useRef(tick)
  useLayoutEffect(() => { callback.current = tick }, [tick])
  useEffect(() => {
    if (!playing) return
    let frame = 0, previous = 0, elapsed = 0
    function draw(now: number) {
      if (document.hidden) return
      if (previous) elapsed += Math.min(now - previous, 100)
      previous = now
      const interval = Math.max(1, intervalMs)
      if (elapsed >= interval) {
        elapsed %= interval
        callback.current()
      }
      frame = requestAnimationFrame(draw)
    }
    const resume = () => {
      cancelAnimationFrame(frame)
      previous = 0
      if (!document.hidden) frame = requestAnimationFrame(draw)
    }
    resume()
    document.addEventListener('visibilitychange', resume)
    return () => { cancelAnimationFrame(frame); document.removeEventListener('visibilitychange', resume) }
  }, [playing, intervalMs])
}
