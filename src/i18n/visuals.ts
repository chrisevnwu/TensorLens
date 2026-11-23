import type { ExactStringTree } from './types'
const en = { insight: 'Why this happened', complete: 'Completed', open: 'Open challenge', equation: 'Equation' } as const
const zh: ExactStringTree<typeof en> = { insight: '原理解析', complete: '已完成', open: '进行中', equation: '公式' }
export const visuals = { en, zh }
