import type { ExactStringTree } from '../types'
const en={
  hardware:'Memory hierarchy',trace:'Virtual score matrix',sram:'On-chip SRAM',hbm:'High-bandwidth memory',pending:'Pending',active:'Active',done:'Done',skipped:'Causal skip',
  'load-q':'Load query block','load-kv':'Load key and value blocks',compute:'Update online softmax',skip:'Skip masked tile',write:'Write normalized output',
  traffic:'HBM traffic',soFar:'Flash · so far',flashTotal:'Flash · full run',standard:'Standard · full run',scaling:'Sequence-length scaling',sequence:'Sequence length N (log₂)',
  reads:'HBM reads (elements)',writes:'HBM writes (elements)',microtile:'SRAM micro-tile',current:'Current tile',matrixValues:'Matrix values',row:'Row',
  accumulator:'Partial numerator',normalized:'Normalized output',noScore:'Score and probability tiles are available during the compute step.',
  standardPhases:'Standard attention transfers',unwritten:'Not written',footprint:'Tile workspace',
} as const
const zh:ExactStringTree<typeof en>={
  hardware:'存储层级',trace:'虚拟分数矩阵',sram:'片上 SRAM',hbm:'高带宽显存',pending:'待处理',active:'活动分块',done:'已完成',skipped:'因果跳过',
  'load-q':'加载查询块','load-kv':'加载键和值块',compute:'更新在线 Softmax',skip:'跳过掩码块',write:'写回归一化输出',
  traffic:'HBM 访存量',soFar:'Flash · 当前累计',flashTotal:'Flash · 完整运行',standard:'标准注意力 · 完整运行',scaling:'序列长度与访存量',sequence:'序列长度 N（log₂）',
  reads:'HBM 读取元素数',writes:'HBM 写入元素数',microtile:'SRAM 微分块',current:'当前分块',matrixValues:'矩阵数值',row:'行',
  accumulator:'部分累积分子',normalized:'归一化输出',noScore:'进入计算步骤后可查看分数和概率分块。',
  standardPhases:'标准注意力访存步骤',unwritten:'尚未写入',footprint:'分块工作集',
}
export const flashVisuals={en,zh}
