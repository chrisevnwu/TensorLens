import type { ChapterId, LabDifficulty } from '../labs/types'
import type { ExactStringTree } from './types'

export const commonEn = {
  chapters: {
    'sequence-attention': 'Sequence & Attention',
    'architecture-inference': 'Architecture & Inference',
    'efficiency-alignment': 'Efficiency & Alignment',
    'training-generative': 'Training & Generative',
  } satisfies Record<ChapterId, string>,
  difficulties: {
    foundational: 'Foundational', intermediate: 'Intermediate', advanced: 'Advanced',
  } satisfies Record<LabDifficulty, string>,
} as const

export const commonZh: ExactStringTree<typeof commonEn> = {
  chapters: {
    'sequence-attention': '序列与注意力',
    'architecture-inference': '架构与推理',
    'efficiency-alignment': '效率与对齐',
    'training-generative': '训练与生成',
  },
  difficulties: { foundational: '基础', intermediate: '进阶', advanced: '高级' },
}

export const common = { en: commonEn, zh: commonZh } as const
