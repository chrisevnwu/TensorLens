import { afterEach, expect, it } from 'vitest'
import { useAppStore as store } from './useAppStore'

const defaults = store.getState()

afterEach(() => {
  store.setState(defaults, true)
  localStorage.clear()
})

it('restores locale, theme, panels, last lab and distinct challenges per lab', async () => {
  const state = store.getState()
  state.setLocale('zh')
  state.setTheme('light')
  state.setLeftCollapsed(true)
  state.setRightCollapsed(true)
  state.setLastVisitedLabId('bpe-tokenizer')
  state.markChallengeCompleted('bpe-tokenizer', 'merge')
  state.markChallengeCompleted('bpe-tokenizer', 'merge')
  state.markChallengeCompleted('embeddings-rope', 'merge')
  const snapshot = localStorage.getItem('tensorlens')!
  store.setState(defaults, true)
  localStorage.setItem('tensorlens', snapshot)
  await store.persist.rehydrate()
  expect(store.getState()).toMatchObject({
    locale: 'zh', theme: 'light', leftCollapsed: true, rightCollapsed: true, lastVisitedLabId: 'bpe-tokenizer',
    completedChallenges: { 'bpe-tokenizer': ['merge'], 'embeddings-rope': ['merge'] },
  })
})

it('preserves usable preferences when other fields are malformed', async () => {
  localStorage.setItem('tensorlens', JSON.stringify({ version: 1, state: {
    theme: 'unknown', locale: 42, setTheme: null, leftCollapsed: true, rightCollapsed: 'yes',
    lastVisitedLabId: 'no-such-route', completedChallenges: {
      'bpe-tokenizer': ['merge', false, 'merge', ''], 'embeddings-rope': 'incomplete', unknown: ['orphan'],
    },
  } }))
  await store.persist.rehydrate()
  expect(store.getState()).toMatchObject({
    locale: 'en', theme: defaults.theme, setTheme: defaults.setTheme,
    lastVisitedLabId: null, leftCollapsed: true, rightCollapsed: false,
    completedChallenges: { 'bpe-tokenizer': ['merge'] },
  })
  expect(Object.keys(store.getState().completedChallenges)).toEqual(['bpe-tokenizer'])
})
