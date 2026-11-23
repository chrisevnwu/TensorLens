import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Locale } from '../i18n/types'
import { getLabById } from '../labs/registry'

export type ThemeMode = 'dark' | 'light'

interface AppState {
  theme: ThemeMode
  locale: Locale
  completedChallenges: Record<string, string[]>
  lastVisitedLabId: string | null
  leftCollapsed: boolean
  rightCollapsed: boolean
  setTheme: (theme: ThemeMode) => void
  setLocale: (locale: Locale) => void
  setLastVisitedLabId: (id: string) => void
  setLeftCollapsed: (collapsed: boolean) => void
  setRightCollapsed: (collapsed: boolean) => void
  markChallengeCompleted: (labId: string, challengeId: string) => void
}

function preferLight(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-color-scheme: light)').matches
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function restorePreferences(saved: unknown, current: AppState): AppState {
  if (!isRecord(saved)) return current
  const restored = { ...current }
  if (saved.theme === 'dark' || saved.theme === 'light') restored.theme = saved.theme
  if (saved.locale === 'en' || saved.locale === 'zh') restored.locale = saved.locale
  if (typeof saved.leftCollapsed === 'boolean') restored.leftCollapsed = saved.leftCollapsed
  if (typeof saved.rightCollapsed === 'boolean') restored.rightCollapsed = saved.rightCollapsed
  if (typeof saved.lastVisitedLabId === 'string' && getLabById(saved.lastVisitedLabId)) {
    restored.lastVisitedLabId = saved.lastVisitedLabId
  }
  if (isRecord(saved.completedChallenges)) {
    restored.completedChallenges = {}
    for (const [id, items] of Object.entries(saved.completedChallenges)) {
      if (!getLabById(id) || !Array.isArray(items)) continue
      const challenges = items.filter((item): item is string => typeof item === 'string' && item.length > 0)
      if (challenges.length) restored.completedChallenges[id] = [...new Set(challenges)]
    }
  }
  return restored
}

export const useAppStore = create<AppState>()(persist((set) => ({
  theme: preferLight() ? 'light' : 'dark',
  locale: 'en',
  completedChallenges: {},
  lastVisitedLabId: null,
  leftCollapsed: false,
  rightCollapsed: false,
  setTheme: (theme) => set({ theme }),
  setLocale: (locale) => set({ locale }),
  setLastVisitedLabId: (lastVisitedLabId) => set({ lastVisitedLabId }),
  setLeftCollapsed: (leftCollapsed) => set({ leftCollapsed }),
  setRightCollapsed: (rightCollapsed) => set({ rightCollapsed }),
  markChallengeCompleted: (labId, challengeId) => set((state) => {
    const existing = state.completedChallenges[labId] ?? []
    if (existing.includes(challengeId)) return state
    return { completedChallenges: { ...state.completedChallenges, [labId]: [...existing, challengeId] } }
  }),
}), { name: 'tensorlens', version: 1, merge: restorePreferences }))
