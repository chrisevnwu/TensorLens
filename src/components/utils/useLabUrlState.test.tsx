import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { booleanField, choiceField, numberField, stringField, makeUrlCodec, useLabUrlState } from './useLabUrlState'

const initial = { step: 0, show: true, prompt: '你好', mode: 'q' as 'q' | 'k' }
const codec = makeUrlCodec<typeof initial>({
  step: numberField(0, 8, 1), show: booleanField, prompt: stringField(30), mode: choiceField(['q', 'k']),
})
afterEach(() => { cleanup(); vi.useRealTimers(); history.replaceState(null, '', '/') })
it('rejects malformed inputs, bounds steps, and preserves Unicode and literal delimiters', () => {
  expect(codec.decode(new URLSearchParams('step=-6&show=nope&mode=bad'), initial)).toEqual(initial)
  expect(codec.decode(new URLSearchParams('step=Infinity'), initial).step).toBe(0)
  const changed = { ...initial, step: 7, show: false, prompt: '计算 #?& 🚀' }
  expect(codec.decode(new URLSearchParams(codec.encode(changed)), initial)).toEqual(changed)
})
it('shares pending edits immediately and restores the state on hash navigation', () => {
  vi.useFakeTimers()
  history.replaceState(null, '', '/#/labs/demo?step=20')
  const { result } = renderHook(() => useLabUrlState(initial, codec))
  expect(result.current.state.step).toBe(8)
  act(() => result.current.setState({ ...initial, prompt: 'a&b', step: 2 }))
  expect(result.current.getShareUrl()).toContain('prompt=a%26b')
  act(() => vi.advanceTimersByTime(160))
  expect(location.href).toBe(result.current.getShareUrl())
  act(() => {
    history.replaceState(null, '', '/#/labs/demo?step=4')
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  })
  expect(result.current.state.step).toBe(4)
})
