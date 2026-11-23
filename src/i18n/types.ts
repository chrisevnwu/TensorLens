export type Locale = 'en' | 'zh'

/** Widen translated values while preserving every required key and tuple slot. */
export type ExactStringTree<T> = {
  [K in keyof T]: T[K] extends string ? string : ExactStringTree<T[K]>
}

export type Localized<T> = Readonly<Record<Locale, T>>
