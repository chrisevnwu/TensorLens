import { getLabById } from '../labs/registry'
import { useAppStore } from '../store/useAppStore'
import { common } from './common'

export type { ExactStringTree, Locale, Localized } from './types'

export function useI18n() {
  const locale = useAppStore((state) => state.locale)
  const setLocale = useAppStore((state) => state.setLocale)
  return {
    locale,
    setLocale,
    toggleLocale: () => setLocale(locale === 'en' ? 'zh' : 'en'),
    common: common[locale],
    lab: (id: string) => {
      const definition = getLabById(id)
      if (definition) return {
        title: definition.title[locale],
        description: definition.description[locale],
        tags: definition.tags[locale],
      }
    },
  }
}
