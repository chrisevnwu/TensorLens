import type { ExactStringTree } from '../types'

const en = {
  presets: { standard: 'Standard RoPE (10k)', llama3: 'Llama 3 long context (500k)', highfreq: 'High-frequency demo (100)', interpolation: 'Position interpolation (4×)' },
  m: 'Query position (m)', n: 'Key position (n)', offset: 'Shift both positions',
  ropeBase: 'Frequency base', dim: 'Embedding dimensions', mode: 'Scaling mode',
  modes: { none: 'None', pi: 'PI', ntk: 'NTK' }, scaleFactor: 'Scale factor',
  compare: 'Compare additive sinusoidal encoding',
  relative: 'Relative offset (m − n)', dot: 'RoPE dot product', norm: 'Query norm ratio',
  fastest: 'Fastest plane angle', baseline: 'Before shifting',
  guide: 'Each wheel rotates one pair of coordinates. Use the stepper to inspect the planes from highest to lowest frequency. The dot product sums the pairwise contributions.',
  modesGuide: 'Position interpolation slows every plane by the same factor. With NTK scaling the fastest plane keeps its original rate and the slowest runs at 1/s of its original rate.',
  additive: 'Additive sinusoidal encoding adds sine and cosine to the original vectors. A common positional shift can change its score because the content and positional terms interact.',
  missions: {
    relative: { title: 'Keep the relative distance', description: 'Move both positions by at least 5 and compare the new dot product with its value before the shift.',
      insight: 'Equal rotations cancel inside the inner product. Only the relative phase between the query and key changes their alignment.' },
    norm: { title: 'Preserve the vector norm', description: 'Set the query position to 20 or higher and check that the query norm ratio is 1.',
      insight: 'Every plane applies an orthogonal transformation. Its squared length stays fixed, so the full vector retains its length.' },
    context: { title: 'Extend the context', description: 'Select NTK scaling and a scale factor of at least 4. Compare the fastest and slowest planes.',
      insight: 'The exponent of the first frequency is zero. Increasing the base leaves this plane unchanged while progressively slowing the lower frequencies.' },
  },
} as const

const zh: ExactStringTree<typeof en> = {
  presets: { standard: '标准 RoPE（基数 1 万）', llama3: 'Llama 3 长上下文（基数 50 万）', highfreq: '高频演示（基数 100）', interpolation: '位置插值（4 倍）' },
  m: '查询位置 (m)', n: '键位置 (n)', offset: '同步平移两个位置', ropeBase: '频率基数', dim: '嵌入维数', mode: '缩放模式',
  modes: { none: '无缩放', pi: 'PI', ntk: 'NTK' }, scaleFactor: '缩放因子', compare: '对比加法正弦位置编码',
  relative: '相对位移 (m − n)', dot: 'RoPE 点积', norm: '查询向量范数比', fastest: '最快平面相对角',
  baseline: '平移前',
  guide: '每个圆盘对应一对坐标。通过步进器可以从高频到低频逐个检查平面。把各平面的点积相加就得到总点积。',
  modesGuide: '位置插值让所有平面减速相同倍数。NTK 缩放保持最高频平面的原有转速，并把最低频平面的转速降为原来的 1/s。',
  additive: '加法正弦位置编码把正弦和余弦直接加到原始向量上。共同平移会改变内容和位置分量之间的交叉项，因此可能改变点积。',
  missions: {
    relative: { title: '保持相对距离', description: '将两个位置同步平移至少 5 个单位，比较平移前后的点积。',
      insight: '在内积中，共同的旋转会相互抵消。决定对齐程度的是查询与键之间的相对相位。' },
    norm: { title: '验证范数守恒', description: '把查询位置调至 20 或更高，并确认查询向量的范数比为 1。',
      insight: '每个平面上的变换都是正交旋转，平方长度保持不变。各平面的平方长度求和后，整个向量的长度也保持不变。' },
    context: { title: '扩展上下文', description: '选择 NTK 缩放，将缩放因子调至至少 4，比较最快和最慢的旋转平面。',
      insight: '首个频率的指数为零。增大基数时，该平面的旋转速度不变，越低频的平面则减速越多。' },
  },
}

export const ropeCopy = { en, zh }
