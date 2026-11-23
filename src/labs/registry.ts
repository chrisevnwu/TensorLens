import { lazy } from 'react'
import type { Localized } from '../i18n/types'
import type { ChapterId, LabDefinition } from './types'

export const CHAPTER_ORDER = [
  'sequence-attention', 'architecture-inference', 'efficiency-alignment', 'training-generative',
] as const satisfies readonly ChapterId[]

function text(en: string, zh: string): Localized<string> {
  return { en, zh }
}

/** International acronyms display identically in both languages. */
function tags(...items: (string | [string, string])[]): Localized<readonly string[]> {
  return {
    en: items.map((item) => typeof item === 'string' ? item : item[0]),
    zh: items.map((item) => typeof item === 'string' ? item : item[1]),
  }
}

export const LAB_REGISTRY: readonly LabDefinition[] = [
  {
    component: lazy(() => import('./bpe-tokenizer')),
    id: 'bpe-tokenizer', number: 1, chapter: 'sequence-attention', difficulty: 'foundational',
    title: text('BPE Tokenizer & Subword Lab', '分词器与 BPE 合并实验室'),
    description: text('Merge byte pairs and watch a vocabulary emerge from raw text.', '从原始文本出发，逐步合并字节对，观察词表如何形成。'),
    tags: tags('BPE', 'UTF-8', ['Subwords', '子词'], ['Compression', '压缩']),
  },
  {
    component: lazy(() => import('./embeddings-rope')),
    id: 'embeddings-rope', number: 2, chapter: 'sequence-attention', difficulty: 'intermediate',
    title: text('Embeddings & RoPE Geometry', '词嵌入与 RoPE 旋转位置编码'),
    description: text('Rotate paired coordinates to see how attention measures relative position.', '旋转成对坐标，观察注意力如何度量相对位置。'),
    tags: tags('RoPE', ['Sinusoidal', '正弦位置编码'], ['Long Context', '长上下文'], 'NTK'),
  },
  {
    component: lazy(() => import('./attention-debugger')),
    id: 'attention-debugger', number: 3, chapter: 'sequence-attention', difficulty: 'foundational',
    title: text('Multi-Head Attention Debugger', '自注意力与多头注意力调试器'),
    description: text('Follow a query through scoring, masking and mixing across attention heads.', '追踪查询向量，看多个注意力头如何打分、施加掩码并聚合信息。'),
    tags: tags(['Self-Attention', '自注意力'], 'Softmax', ['Causal Mask', '因果掩码'], 'MHA/GQA/MQA'),
  },
  {
    component: lazy(() => import('./norm-residual')),
    id: 'norm-residual', number: 4, chapter: 'architecture-inference', difficulty: 'intermediate',
    title: text('LayerNorm, RMSNorm & Residual Stream', '归一化与残差流实验室'),
    description: text('Follow activations and gradients down a stack of residual blocks.', '逐层追踪残差网络中的激活幅度与梯度变化。'),
    tags: tags(['Pre-Norm', '前置归一化'], 'RMSNorm', ['Residual', '残差连接'], 'SwiGLU'),
  },
  {
    component: lazy(() => import('./kv-cache-profiler')),
    id: 'kv-cache-profiler', number: 5, chapter: 'architecture-inference', difficulty: 'intermediate',
    title: text('KV Cache & Prefill/Decode Profiler', 'KV Cache 与推理显存剖析器'),
    description: text('Compare cached decoding costs and locate the GPU bandwidth ceiling.', '对比有无缓存的解码开销，在屋顶线图上定位显存带宽瓶颈。'),
    tags: tags(['KV Cache', 'KV 缓存'], ['Prefill', '预填充'], ['Decode', '解码'], ['Roofline', '屋顶线模型'], 'GQA/MLA'),
  },
  {
    component: lazy(() => import('./flash-attention')),
    id: 'flash-attention', number: 6, chapter: 'architecture-inference', difficulty: 'advanced',
    title: text('FlashAttention Tiling & SRAM Simulator', 'FlashAttention 分块与显存层级模拟'),
    description: text('Step through SRAM tiles and count memory transfers for exact attention.', '逐块观察片上 SRAM 的计算，统计精确注意力所需的显存传输。'),
    tags: tags('FlashAttention', ['Online Softmax', '在线 Softmax'], 'SRAM', ['IO-Aware', 'I/O 感知']),
  },
  {
    component: lazy(() => import('./moe-routing')),
    id: 'moe-routing', number: 7, chapter: 'architecture-inference', difficulty: 'intermediate',
    title: text('MoE Router & Load Balancing', 'MoE 稀疏路由与负载均衡沙盒'),
    description: text('Route tokens to experts and compare strategies for overloaded queues.', '把词元分配给专家，比较不同均衡策略如何缓解过载。'),
    tags: tags('MoE', ['Top-K Gating', 'Top-K 门控'], ['Capacity Factor', '容量因子'], ['Expert Collapse', '专家坍缩']),
  },
  {
    component: lazy(() => import('./quantization')),
    id: 'quantization', number: 8, chapter: 'efficiency-alignment', difficulty: 'intermediate',
    title: text('Quantization & Precision Loss Lab', '量化与精度损失实验室'),
    description: text('Inspect floating-point bits and measure what low-bit weights discard.', '拆解浮点数的位表示，测量低比特权重量化带来的误差。'),
    tags: tags('FP8', 'BF16', 'INT4', 'NF4', ['Outliers', '离群值'], 'SmoothQuant'),
  },
  {
    component: lazy(() => import('./decoding-sampling')),
    id: 'decoding-sampling', number: 9, chapter: 'efficiency-alignment', difficulty: 'foundational',
    title: text('Decoding & Sampling Playground', '文本解码与采样策略实验室'),
    description: text('Reshape a token distribution or search for the best sequence with beams.', '调整词元概率分布，或用束搜索寻找得分更高的序列。'),
    tags: tags(['Temperature', '温度'], 'Top-K', ['Top-P', 'Top-P 核采样'], 'Min-P', ['Beam Search', '束搜索']),
  },
  {
    component: lazy(() => import('./lora-svd')),
    id: 'lora-svd', number: 10, chapter: 'efficiency-alignment', difficulty: 'intermediate',
    title: text('LoRA & Low-Rank SVD Lab', 'LoRA 低秩微调与 SVD 谱分析'),
    description: text('Train low-rank adapters and compare their error to the optimal SVD bound.', '训练低秩适配器，将重构误差与 SVD 的理论最优值进行比较。'),
    tags: tags('LoRA', 'QLoRA', 'SVD', ['Low-Rank', '低秩'], 'PEFT'),
  },
  {
    component: lazy(() => import('./backprop-optimizers')),
    id: 'backprop-optimizers', number: 11, chapter: 'training-generative', difficulty: 'foundational',
    title: text('Autograd & Optimizers Arena', '反向传播计算图与优化器竞技场'),
    description: text('Trace the chain rule, then race five optimizers across a loss landscape.', '跟随链式法则反向传播，再比较五种优化器在损失曲面上的轨迹。'),
    tags: tags(['Backprop', '反向传播'], ['Chain Rule', '链式法则'], 'SGD', 'Adam', 'AdamW', ['Cosine LR', '余弦学习率']),
  },
  {
    component: lazy(() => import('./diffusion-flow')),
    id: 'diffusion-flow', number: 12, chapter: 'training-generative', difficulty: 'advanced',
    title: text('Diffusion & Flow Matching Lab', '扩散模型与 Flow Matching 去噪实验室'),
    description: text('Guide a shared noise cloud to data with three different generative solvers.', '让三种生成求解器从同一团噪声出发，观察通向目标数据的不同路径。'),
    tags: tags('DDPM', 'DDIM', ['Flow Matching', '流匹配'], ['Score Field', '得分场'], 'CFG'),
  },
  {
    component: lazy(() => import('./language-model-loss')),
    id: 'language-model-loss', number: 13, chapter: 'training-generative', difficulty: 'foundational',
    title: text('Next-Token Loss & Perplexity', '下一词元损失与困惑度'),
    description: text('Score a sequence note by note and see how one confident mistake changes perplexity.', '逐个音符为预测打分，观察一次自信的错误怎样改变整段序列的困惑度。'),
    tags: tags(['Cross-entropy', '交叉熵'], ['Perplexity', '困惑度'], ['Language modeling', '语言建模'], 'NLL'),
  },
  {
    component: lazy(() => import('./hybrid-retrieval')),
    id: 'hybrid-retrieval', number: 14, chapter: 'architecture-inference', difficulty: 'intermediate',
    title: text('Hybrid Retrieval & Rank Fusion', '混合检索与排序融合'),
    description: text('Find repair notes by fault code or by symptom, then compare the ranked evidence.', '用故障码或症状检索维修记录，对照关键词匹配、向量相似度和融合后的排名。'),
    tags: tags('BM25', 'RAG', ['Rank fusion', '排序融合'], ['Recall@K', '召回率'], ['Cosine similarity', '余弦相似度']),
  },
  {
    component: lazy(() => import('./preference-dpo')),
    id: 'preference-dpo', number: 15, chapter: 'efficiency-alignment', difficulty: 'advanced',
    title: text('Direct Preference Optimization', '直接偏好优化（DPO）'),
    description: text('Train a two-answer policy on preference votes and compare its probabilities with a frozen reference.', '用偏好票训练一个有两种回答的策略，追踪它与固定参考策略的概率差异。'),
    tags: tags('DPO', ['Alignment', '偏好对齐'], ['KL divergence', 'KL 散度'], ['Preference learning', '偏好学习']),
  },
  {
    component: lazy(() => import('./knowledge-distillation')),
    id: 'knowledge-distillation', number: 16, chapter: 'efficiency-alignment', difficulty: 'intermediate',
    title: text('Knowledge Distillation', '知识蒸馏'),
    description: text('Swap the teacher’s second-choice instrument and see which student learns the difference.', '交换教师排在第二、三位的乐器，观察哪位学生能学到这个区别。'),
    tags: tags(['Distillation', '蒸馏'], ['Soft targets', '软标签'], ['Teacher temperature', '教师温度'], ['KL divergence', 'KL 散度']),
  },
  {
    component: lazy(() => import('./speculative-decoding')),
    id: 'speculative-decoding', number: 17, chapter: 'architecture-inference', difficulty: 'advanced',
    title: text('Speculative Decoding', '投机解码'),
    description: text('Verify draft tokens in blocks and count the target calls needed to generate a sequence.', '让目标模型逐块验证草稿，追踪每个词元如何被接受或纠正，并统计调用次数。'),
    tags: tags(['Draft model', '草稿模型'], ['Rejection sampling', '拒绝采样'], ['Target calls', '目标模型调用'], ['Speculative sampling', '投机采样']),
  },
  {
    component: lazy(() => import('./image-text-contrastive')),
    id: 'image-text-contrastive', number: 18, chapter: 'training-generative', difficulty: 'intermediate',
    title: text('Image–Text Contrastive Learning', '图文对比学习'),
    description: text('Swap two captions and trace the matching loss along the rows and columns of a similarity matrix.', '交换两条图注，沿着相似度矩阵的行与列，找出图文匹配损失发生变化的位置。'),
    tags: tags('CLIP', 'InfoNCE', ['Contrastive learning', '对比学习'], ['Cosine similarity', '余弦相似度']),
  },
]

export function getLabById(id: string | null | undefined) {
  return LAB_REGISTRY.find((lab) => lab.id === id)
}

export function getAdjacentLabs(id: string) {
  const index = LAB_REGISTRY.findIndex((lab) => lab.id === id)
  return {
    previous: index > 0 ? LAB_REGISTRY[index - 1] : undefined,
    next: index >= 0 ? LAB_REGISTRY[index + 1] : undefined,
  }
}
