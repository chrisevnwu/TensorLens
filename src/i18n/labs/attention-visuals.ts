import type { ExactStringTree } from '../types'

const en = {
  pipeline: ['Embeddings', 'Project Q, K, V', 'Dot products', 'Scale and mask', 'Softmax weights', 'Weighted output'],
  heatmap: 'Attention weights', arcs: 'Token attention', topology: 'KV head sharing',
  params: 'KV parameters', inspect: 'Selected pair', numbers: 'Matrix values',
  raw: 'Raw score', scaled: 'Scaled score', masked: 'After mask', weight: 'Attention weight',
  terms: 'Dot-product terms', contribution: 'Value contribution', query: 'Query', key: 'Key',
  empty: 'Enter at least one token to inspect attention.', rowSum: 'Row sum',
} as const
const zh: ExactStringTree<typeof en> = {
  pipeline: ['词嵌入', '投影 Q、K、V', '点积计算', '缩放与掩码', 'Softmax 权重', '加权输出'],
  heatmap: '注意力权重', arcs: '词元注意力连线', topology: 'KV 头共享',
  params: 'KV 参数量', inspect: '已选词元对', numbers: '矩阵数值',
  raw: '原始得分', scaled: '缩放得分', masked: '掩码后得分', weight: '注意力权重',
  terms: '逐维点积项', contribution: '值向量贡献', query: '查询', key: '键',
  empty: '请至少输入一个词元以检查注意力。', rowSum: '行和',
}
export const attentionVisuals = { en, zh }
