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
    id: 'lora-svd', number: 10, chapter: 'efficiency-alignment', difficulty: 'intermediate',
    title: text('LoRA & Low-Rank SVD Lab', 'LoRA 低秩微调与 SVD 谱分析'),
    description: text('Train low-rank adapters and compare their error to the optimal SVD bound.', '训练低秩适配器，将重构误差与 SVD 的理论最优值进行比较。'),
    tags: tags('LoRA', 'QLoRA', 'SVD', ['Low-Rank', '低秩'], 'PEFT'),
  },
  {
    id: 'backprop-optimizers', number: 11, chapter: 'training-generative', difficulty: 'foundational',
    title: text('Autograd & Optimizers Arena', '反向传播计算图与优化器竞技场'),
    description: text('Trace the chain rule, then race five optimizers across a loss landscape.', '跟随链式法则反向传播，再比较五种优化器在损失曲面上的轨迹。'),
    tags: tags(['Backprop', '反向传播'], ['Chain Rule', '链式法则'], 'SGD', 'Adam', 'AdamW', ['Cosine LR', '余弦学习率']),
  },
  {
    id: 'diffusion-flow', number: 12, chapter: 'training-generative', difficulty: 'advanced',
    title: text('Diffusion & Flow Matching Lab', '扩散模型与 Flow Matching 去噪实验室'),
    description: text('Guide a shared noise cloud to data with three different generative solvers.', '让三种生成求解器从同一团噪声出发，观察通向目标数据的不同路径。'),
    tags: tags('DDPM', 'DDIM', ['Flow Matching', '流匹配'], ['Score Field', '得分场'], 'CFG'),
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
