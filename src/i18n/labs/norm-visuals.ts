import type { ExactStringTree } from '../types'

const en = {
  forward:'Activation norm and channel spread',backward:'Backward gradient norm',
  layer:'Layer', range:'Channel min–max', scale:'Vertical scale',linear:'Linear',symlog:'Symmetric log',
  slice:'Channel slice', channel:'Channel', raw:'Input', fraction:'Cosine to input', mean:'Mean', std:'Std. dev.',
  clipped:'This layer reached the finite activation limit.',
} as const
const zh: ExactStringTree<typeof en> = {
  forward:'激活范数与通道范围',backward:'反向梯度范数',layer:'层',range:'通道最小值至最大值',
  scale:'纵轴刻度',linear:'线性',symlog:'对称对数',slice:'通道切片',channel:'通道',
  raw:'输入',fraction:'与输入的余弦相似度',mean:'均值',std:'标准差',clipped:'本层触及激活值上限。',
}
export const normVisuals = { en, zh }
