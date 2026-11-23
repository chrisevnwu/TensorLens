import type { ExactStringTree } from './types'

const en = { cell: 'Inspect matrix cell', row: 'Row', column: 'Column' } as const
const zh: ExactStringTree<typeof en> = { cell: '检查矩阵单元', row: '行', column: '列' }
export const chartCopy = { en, zh }
