import type { ExactStringTree } from '../types'
const en={
  title:'Beam search tree',root:'Start',active:'Active beam',pruned:'Pruned',expanded:'Expanded',pending:'Unexpanded',
  path:'Leading sequence',guide:'Each node shows the cumulative log probability ℓ and the length-normalized score s.',
  selected:'Selected sequence',conditional:'Next-token probability',joint:'Sequence probability',log:'Cumulative log probability',
  score:'Length-normalized score',length:'Length in tokens',depth:'Step',finish:'Completed sequence',
} as const
const zh:ExactStringTree<typeof en>={
  title:'束搜索树',root:'起点',active:'活跃候选',pruned:'已剪枝',expanded:'已展开',pending:'待展开',
  path:'当前最优序列',guide:'每个节点显示累计对数概率 ℓ 和按长度归一化的得分 s。',
  selected:'所选序列',conditional:'下一词元的条件概率',joint:'序列联合概率',log:'累计对数概率',
  score:'长度归一化得分',length:'词元数',depth:'步',finish:'完整序列',
}
export const beamCopy={en,zh}
