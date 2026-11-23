import type { ExactStringTree } from '../types'

const en = {
  presets:{small:'Small trace',fine:'Fine tiles',causal:'Causal block skipping'},
  seq:'Sequence length', br:'Query tile rows (Bᵣ)', bc:'Key tile columns (B꜀)', causal:'Causal mask', sram:'SRAM budget (KiB)',
  flash:'Flash HBM traffic', standard:'Standard HBM traffic', speedup:'HBM traffic ratio', error:'Max output error',
  total:'Full execution, including reads and writes.', measured:'Measured maximum absolute difference', ratioHint:'Standard bytes / tiled bytes.',
  phases:{'load-q':'Load the query block','load-kv':'Load keys and values',compute:'Update online softmax',skip:'Skip a future block',write:'Write the normalized output'},
  guides:{
    'load-q':'Read the next query rows into SRAM. Start each row maximum at negative infinity, with zero mass and an empty output accumulator.',
    'load-kv':'Load one key/value tile. Keep the query, row maximum, mass and partial output on chip for the next update.',
    compute:'Score the active tile. When a larger row maximum appears, rescale the previous mass and weighted sum by exp(m_old − m_new) before adding the new tile.',
    skip:'All keys in this block lie strictly after its last query position. No key or value transfer is needed for this block.',
    write:'Divide each accumulated value vector by its final row mass. Write those output rows back to HBM once.',
  },
  precision:'The equality check uses Float64 math. HBM traffic models two bytes per stored element. The SRAM scaling chart models a 64-channel head and chooses tiles that fit the selected budget.',
  narrow:'At the same sequence length, column tile and mask, two-row query tiles move {bytes} B in total.',
  missions:{
    exact:{title:'Verify exact attention',description:'Finish the trace and check that the largest output difference is below 10⁻¹⁰.',
      insight:'Tracking a running maximum and denominator preserves the normalized weighted sum across tile boundaries.'},
    skipping:{title:'Skip six causal tiles',description:'Use N = 16 with 4 × 4 tiles and the causal mask. Advance until six upper-triangular blocks have been skipped.',
      insight:'Whole blocks above the causal diagonal can be discarded before loading their keys and values. The diagonal blocks still mask individual future entries.'},
    tiles:{title:'Reduce key/value reloads',description:'Compare query tile heights 2 and 8 at N = 8 or 16. Keep the column width and mask fixed.',
      insight:'A wider group of query rows reuses each loaded key/value tile. The query read and output write volumes stay fixed.'},
  },
} as const
const zh: ExactStringTree<typeof en> = {
  presets:{small:'小规模轨迹',fine:'细粒度分块',causal:'因果掩码跳块'},
  seq:'序列长度',br:'查询块行数 (Bᵣ)',bc:'键块列数 (B꜀)',causal:'因果掩码',sram:'SRAM 容量（KiB）',
  flash:'Flash HBM 流量',standard:'标准注意力 HBM 流量',speedup:'HBM 流量比',error:'最大输出误差',
  total:'完整执行的读写总量。',measured:'实际最大绝对差',ratioHint:'标准注意力字节数除以分块注意力字节数。',
  phases:{'load-q':'载入查询块','load-kv':'载入键和值',compute:'更新在线 Softmax',skip:'跳过未来块',write:'写回归一化输出'},
  guides:{
    'load-q':'把下一组查询行读入 SRAM。每行最大值从负无穷开始，概率质量和输出累加器均从零开始。',
    'load-kv':'载入一块键和值。查询块、行最大值、概率质量和部分输出继续保留在片上，供下一次更新使用。',
    compute:'计算当前块的分数。若行最大值增大，先把旧概率质量和加权和乘以 exp(旧最大值 − 新最大值)，再累加新块。',
    skip:'此块的每个键都位于最后一个查询位置之后，可以直接跳过，无需传输其中的键和值。',
    write:'把每行的值向量累加和除以该行最终的概率质量，再把这些输出行写回 HBM 一次。',
  },
  precision:'数值等价检查采用 Float64 计算，HBM 流量按每元素 2 字节估算。SRAM 规模图采用 64 通道注意力头，并选择能容纳在指定容量内的块。',
  narrow:'在相同序列长度、键块宽度和掩码下，查询块为两行时共传输 {bytes} B。',
  missions:{
    exact:{title:'验证注意力数值等价',description:'运行至最后一步，确认最大输出差小于 10⁻¹⁰。',
      insight:'持续更新行最大值和归一化分母后，跨块累加仍可得到相同的归一化加权和。'},
    skipping:{title:'跳过六个因果块',description:'选择 N = 16、4 × 4 分块并启用因果掩码。推进至六个上三角块被跳过。',
      insight:'完全位于因果对角线上方的块可以在加载键和值之前丢弃。对角线上的块仍需逐元素屏蔽未来位置。'},
    tiles:{title:'减少键和值的重复读取',description:'在 N = 8 或 16 时，先后选择查询块高度 2 和 8，并保持键块宽度和掩码不变。',
      insight:'每次载入的键值块可以在更多查询行之间复用。读取查询和写回输出的总量不变。'},
  },
}

export const flashCopy = {en,zh}
