import type { ComponentType, LazyExoticComponent } from 'react'
import type { Localized } from '../i18n/types'

export type ChapterId =
  | 'sequence-attention'
  | 'architecture-inference'
  | 'efficiency-alignment'
  | 'training-generative'

export type LabDifficulty = 'foundational' | 'intermediate' | 'advanced'

export interface ChallengeStatus {
  id: string
  title: string
  description: string
  insight: string
  completed: boolean
}

export interface LabDefinition {
  id: string
  number: number
  chapter: ChapterId
  difficulty: LabDifficulty
  title: Localized<string>
  description: Localized<string>
  tags: Localized<readonly string[]>
  component?: LazyExoticComponent<ComponentType>
}
