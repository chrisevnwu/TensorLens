import type {ExactStringTree} from '../types'
const en={
  factors:'Adapter factorization',base:'Frozen base',effective:'Adapted weights',target:'Target update',residual:'Residual',
  spectrum:'Singular-value spectrum',captured:'Captured',discarded:'Discarded',energy:'Explained energy',
  loss:'Reconstruction error',step:'Optimizer step',floor:'SVD floor',fit:'Adapter MSE',
  cell:'Matrix entry',optimal:'Optimal rank-r update',update:'Trained update',
} as const
const zh:ExactStringTree<typeof en>={
  factors:'适配器矩阵分解',base:'冻结基座',effective:'适配后权重',target:'目标更新',residual:'残差',
  spectrum:'奇异值谱',captured:'已保留',discarded:'已截断',energy:'已解释能量',
  loss:'重建误差',step:'优化步数',floor:'SVD 下界',fit:'适配器 MSE',
  cell:'矩阵单元',optimal:'秩 r 最优更新',update:'训练所得更新',
}
export const loraVisuals={en,zh}
