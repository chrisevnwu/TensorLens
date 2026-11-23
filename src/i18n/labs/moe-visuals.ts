import type {ExactStringTree} from '../types'
const en={
  routing:'Token-to-expert routing',token:'Token',expert:'Expert',code:'Code',math:'Math',prose:'Prose',logic:'Logic',
  accepted:'Accepted',dropped:'Dropped',unselected:'Unselected',capacity:'Capacity',assigned:'Assigned',fit:'Accepted / assigned',
  history:'Router training history',step:'Training step',gates:'Router probabilities',arrivals:'Incoming routes',weight:'Gate',status:'Dispatch',
  bias:'Selection bias',empty:'No tokens selected this expert.',cv:'Load CV',aux:'Auxiliary loss',
} as const
const zh:ExactStringTree<typeof en>={
  routing:'词元到专家的路由',token:'词元',expert:'专家',code:'代码',math:'数学',prose:'散文',logic:'逻辑',
  accepted:'已接受',dropped:'已丢弃',unselected:'未选中',capacity:'容量',assigned:'分配数',fit:'接受数 / 分配数',
  history:'路由器训练历史',step:'训练步数',gates:'路由概率',arrivals:'传入路由',weight:'门控权重',status:'分配结果',
  bias:'选择偏置',empty:'没有词元选择此专家。',cv:'负载变异系数',aux:'辅助损失',
}
export const moeVisuals={en,zh}
