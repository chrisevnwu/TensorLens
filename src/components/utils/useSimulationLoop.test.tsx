import { act, renderHook } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { useSimulationLoop } from './useSimulationLoop'

it('suspends ticks in a hidden tab, resumes without a backlog and stops on unmount', () => {
  vi.useFakeTimers()
  const visibility = vi.spyOn(document, 'hidden', 'get').mockReturnValue(false)
  const tick = vi.fn()
  const { unmount } = renderHook(() => useSimulationLoop(tick, true, 100))
  try {
    act(() => vi.advanceTimersByTime(150))
    expect(tick).toHaveBeenCalledTimes(1)
    visibility.mockReturnValue(true)
    document.dispatchEvent(new Event('visibilitychange'))
    act(() => vi.advanceTimersByTime(8000))
    expect(tick).toHaveBeenCalledTimes(1)
    visibility.mockReturnValue(false)
    document.dispatchEvent(new Event('visibilitychange'))
    act(() => vi.advanceTimersByTime(140))
    expect(tick).toHaveBeenCalledTimes(2)
    unmount()
    act(() => vi.advanceTimersByTime(900))
    expect(tick).toHaveBeenCalledTimes(2)
  } finally { unmount(); visibility.mockRestore(); vi.useRealTimers() }
})
