import type {ExactStringTree} from '../types'
const en={
  arena:'Optimizer race',start:'Starting point',placement:'Click the landscape to set the start. Use arrow keys to move by 0.05.',
  loss:'Loss by step',lr:'Learning rate',step:'Step',outside:'Outside plot',diverged:'Diverged',
  state:'Optimizer coordinates',gradient:'Gradient norm',position:'Position',none:'Select an optimizer to display a trajectory.',
  sgd:'SGD',momentum:'Momentum',rmsprop:'RMSProp',adam:'Adam',adamw:'AdamW',
} as const
const zh:ExactStringTree<typeof en>={
  arena:'优化器竞速',start:'起点',placement:'点击损失曲面可设置起点，使用方向键每次移动 0.05。',
  loss:'逐步损失',lr:'学习率',step:'步数',outside:'超出绘图区',diverged:'已发散',
  state:'优化器坐标',gradient:'梯度范数',position:'坐标',none:'选择优化器后可查看轨迹。',
  sgd:'SGD',momentum:'动量法',rmsprop:'RMSProp',adam:'Adam',adamw:'AdamW',
}
export const raceVisuals={en,zh}
