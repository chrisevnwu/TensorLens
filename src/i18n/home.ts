import type { ExactStringTree } from './types'

const en = {
  title: 'Explore the math',
  titleAccent: 'behind AI.',
  intro: 'Open up the models. Trace each computation, change the parameters, and see how modern AI works from the inside.',
  start: 'Start with BPE',
  resume: 'Resume lab',
  browse: 'Browse all 12 labs',
  labStat: 'Interactive labs',
  challengeStat: 'Guided challenges',
  mathStat: 'Browser-native math',
  catalog: 'Lab explorer',
  chapter: 'Filter by chapter',
  all: 'All chapters',
  difficulty: 'Difficulty',
  anyDifficulty: 'All levels',
  lab: 'Lab',
  achievements: 'Challenges completed',
  clear: 'Clear filters',
  empty: 'No labs match these filters.',
} as const

const zh: ExactStringTree<typeof en> = {
  title: '探索 AI',
  titleAccent: '背后的数学。',
  intro: '打开模型内部，逐步追踪每一次计算，调整参数，观察现代 AI 的运行原理。',
  start: '从 BPE 开始',
  resume: '继续实验',
  browse: '浏览全部 12 个实验',
  labStat: '个交互实验',
  challengeStat: '项引导挑战',
  mathStat: '浏览器本地计算',
  catalog: '实验目录',
  chapter: '按章节筛选',
  all: '全部章节',
  difficulty: '难度',
  anyDifficulty: '全部难度',
  lab: '实验',
  achievements: '已完成挑战',
  clear: '清除筛选',
  empty: '当前筛选条件下没有实验。',
}

export const homeCopy = { en, zh }
