import type {ExactStringTree} from '../types'
const en={
  tensors:'Tensor comparison',original:'Original',dequantized:'Dequantized',error:'Absolute error',cell:'Selected cell',code:'Stored code',
  scale:'Quantizer scale',channel:'Channel multiplier',zero:'Zero point',group:'Group (flat indices)',hist:'Value distribution and quantization grid',
  count:'Values',local:'Selected group',levels:'Representable levels in view',grid:'Selected cell’s reconstruction grid',axis:'Original tensor value',
  coalesced:'Dense ticks combine levels in the same display interval.',mse:'Mean squared error',
} as const
const zh:ExactStringTree<typeof en>={
  tensors:'张量对比',original:'原始值',dequantized:'反量化值',error:'绝对误差',cell:'选中单元',code:'量化编码',
  scale:'量化尺度',channel:'通道缩放因子',zero:'零点',group:'分组（展平索引）',hist:'数值分布与量化网格',
  count:'数值个数',local:'选中分组',levels:'视图内可表示值数',grid:'选中单元的重建网格',axis:'原始张量数值',
  coalesced:'同一显示区间的密集量化刻度合并显示。',mse:'均方误差',
}
export const quantVisuals={en,zh}
