import { useCallback, useEffect, useState } from 'react'

export interface UrlStateCodec<T> {
  encode(state: T): Record<string, string>
  decode(params: URLSearchParams, fallback: T): T
}

type Reader<T> = (value: string, fallback: T) => T
export const booleanField: Reader<boolean> = (s, fallback) => {
  if (s === 'true' || s === '1') return true
  if (s === 'false' || s === '0') return false
  return fallback
}
export const stringField = (maxLength: number): Reader<string> => s => Array.from(s).slice(0, maxLength).join('')
export function numberField(min: number, max: number, step?: number): Reader<number> {
  return (s, fallback) => {
    const n = Number(s)
    if (!s.trim() || !Number.isFinite(n)) return fallback
    const snapped = step ? min + Math.round((n-min) / step) * step : n
    return Math.max(min, Math.min(max, Number(snapped.toPrecision(14))))
  }
}
export function choiceField<const T extends string | number>(choices: readonly T[]): Reader<T> {
  return (s, fallback) => choices.find(value => String(value) === s) ?? fallback
}

export function makeUrlCodec<T extends object>(fields: { [K in keyof T]: Reader<T[K]> }): UrlStateCodec<T> {
  const keys = Object.keys(fields) as Array<keyof T & string>
  return {
    encode: state => Object.fromEntries(keys.map(key => [key, String(state[key])])),
    decode(params, fallback) {
      const state = { ...fallback }
      for (const key of keys) {
        const value = params.get(key)
        if (value !== null) state[key] = fields[key](value, fallback[key])
      }
      return state
    },
  }
}

function address() {
  const [path, query = ''] = window.location.hash.split(/\?(.*)/s)
  return { path: path || '#/', params: new URLSearchParams(query) }
}

// Pass module-level defaults and codec. Each mounted lab owns only its hash path.
export function useLabUrlState<T>(fallback: T, codec: UrlStateCodec<T>) {
  const [path] = useState(() => address().path)
  const read = useCallback(() => codec.decode(address().params, fallback), [codec, fallback])
  const [state, setState] = useState(read)
  const getShareUrl = useCallback(() => {
    const url = new URL(window.location.href)
    url.hash = path + '?' + new URLSearchParams(codec.encode(state)).toString()
    return url.href
  }, [codec, path, state])
  useEffect(() => {
    function restore() { if (address().path === path) setState(read()) }
    window.addEventListener('popstate', restore)
    window.addEventListener('hashchange', restore)
    return () => {
      window.removeEventListener('popstate', restore)
      window.removeEventListener('hashchange', restore)
    }
  }, [path, read])
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (address().path === path) window.history.replaceState(window.history.state, '', getShareUrl())
    }, 150)
    return () => window.clearTimeout(timeout)
  }, [getShareUrl, path])
  return { state, setState, getShareUrl }
}
