import type { ExactStringTree } from '../types'

const en = {
  presets: { causal: 'Causal decoder (GPT)', encoder: 'Bidirectional encoder (BERT)', saturation: 'Softmax saturation', sliding: 'Sliding window (Mistral)' },
  tokens: 'Input tokens', token: 'Token', tokenHint: 'Separate up to eight tokens with spaces or commas.',
  numHeads: 'Query heads', selectedHead: 'Selected head', scale: 'Divide by √dₖ', logitScale: 'Logit scale',
  mask: 'Attention mask', maskTypes: { causal: 'Causal', bidirectional: 'Bidirectional', sliding: 'Sliding window' },
  windowSize: 'Window size', topology: 'Head topology',
  entropy: 'Mean attention entropy', peak: 'Peak weight', sharing: 'KV sharing ratio', density: 'Allowed mask density',
  nats: 'nats', allowed: 'Fraction of query–key pairs visible to this head.',
  empty: 'Enter at least one token to compute attention.',
  stages: ['Embeddings X', 'Project Q, K, V', 'Scores QKᵀ', 'Scale and mask', 'Softmax weights', 'Weighted output AV'],
  guides: [
    'Every token has a seeded 12-dimensional content and position representation. Repeated words at different positions can produce different rows of X.',
    'Query heads have their own projections. For grouped or multi-query attention, heads assigned to the same KV group reuse its key and value projections.',
    'Each score is a sum of query–key products. Applying the gain to both vectors multiplies their dot product by the square of the gain.',
    'Square-root scaling controls logit magnitude. A mask replaces forbidden scores with negative infinity before probability normalization.',
    'Softmax normalizes each query row over its allowed keys. Mean entropy is measured in nats. A sharply concentrated row has little uncertainty.',
    'Multiply each value vector by its attention weight and sum down the key positions. Concatenate all head outputs, then apply the output projection.',
  ],
  missions: {
    saturation: { title: 'Saturate softmax', description: 'Remove square-root scaling. Set logit scale to 2.5 or higher and bring mean entropy below 0.35 nats.',
      insight: 'Larger score differences become exponentially larger probability ratios. The dominant key receives almost all the weight.' },
    leakage: { title: 'Prevent future leakage', description: 'Compare bidirectional attention with a causal mask on at least two tokens. Check that all future keys have zero weight.',
      insight: 'The causal mask puts negative infinity above the diagonal. Those entries contribute exactly zero to each normalized row.' },
    sharing: { title: 'Share keys and values', description: 'Choose four query heads and GQA. Check the wiring diagram for two query heads per KV group.',
      insight: 'The four heads keep distinct queries while sharing two key and value projections. KV parameters and cache storage are halved relative to four KV heads.' },
  },
} as const

const zh: ExactStringTree<typeof en> = {
  presets: { causal: '因果解码器（GPT）', encoder: '双向编码器（BERT）', saturation: 'Softmax 饱和', sliding: '滑动窗口（Mistral）' },
  tokens: '输入词元', token: '词元', tokenHint: '用空格或逗号分隔，最多八个词元。',
  numHeads: '查询头数', selectedHead: '当前注意力头', scale: '除以 √dₖ', logitScale: '分数增益',
  mask: '注意力掩码', maskTypes: { causal: '因果', bidirectional: '双向', sliding: '滑动窗口' },
  windowSize: '窗口宽度', topology: '注意力头拓扑',
  entropy: '平均注意力熵', peak: '最大权重', sharing: 'KV 头共享比', density: '掩码可见比例',
  nats: '奈特', allowed: '当前注意力头中可见的查询与键组合占比。',
  empty: '输入至少一个词元即可计算注意力。',
  stages: ['输入嵌入 X', '投影 Q、K、V', '计算 QKᵀ 分数', '缩放与掩码', 'Softmax 权重', '加权输出 AV'],
  guides: [
    '每个词元都具有由固定种子生成的 12 维内容和位置表示。同一个词出现在不同位置时，X 的对应行可能不同。',
    '各查询头拥有独立的查询投影。在分组查询或多查询注意力中，属于同一 KV 组的查询头复用该组的键和值投影。',
    '每个分数是对应查询与键各维乘积之和。同时增大两个向量的幅度，会使点积按增益的平方变化。',
    '除以维度的平方根可以控制分数幅度。掩码在归一化前将不可见位置的分数替换为负无穷。',
    'Softmax 对每个查询行中允许访问的键进行归一化。平均熵采用自然对数，以奈特为单位。权重越集中，不确定性就越低。',
    '把每个值向量乘以对应的注意力权重，然后沿键位置求和。拼接各头输出，再乘以输出投影矩阵。',
  ],
  missions: {
    saturation: { title: '触发 Softmax 饱和', description: '关闭平方根缩放，将分数增益调至至少 2.5，使平均熵低于 0.35 奈特。',
      insight: '分数差异经指数运算后变成倍数更大的概率差距，占优势的键几乎获得全部权重。' },
    leakage: { title: '阻止未来信息泄露', description: '对至少两个词元先试用双向注意力，再切换因果掩码，确认所有未来位置的权重都为零。',
      insight: '因果掩码把主对角线上方的分数设为负无穷。归一化后，这些位置的权重恰好为零。' },
    sharing: { title: '共享键和值', description: '选择四个查询头及 GQA，在连线图上确认每两个查询头共用一个 KV 组。',
      insight: '四个头具有不同的查询，同时共用两组键和值投影。与四组独立 KV 头相比，KV 参数和缓存用量减半。' },
  },
}

export const attentionCopy = { en, zh }
