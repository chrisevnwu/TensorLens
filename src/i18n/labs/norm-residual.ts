import type { ExactStringTree } from '../types'

const en = {
  presets: { modern: 'Modern LLM · Pre-RMSNorm', classic: 'Classic Transformer · Post-LayerNorm', exploding: 'Exploding deep net', outlier: 'Outlier stress test' },
  numLayers: 'Stack depth', placement: 'Norm placement', placements: { 'pre-norm': 'Pre-Norm', 'post-norm': 'Post-Norm', none: 'No Norm' },
  normType: 'Normalization', norms: { layernorm: 'LayerNorm', rmsnorm: 'RMSNorm' }, useResidual: 'Residual connection',
  activation: 'Activation', weightGain: 'Weight gain', outlierMag: 'Outlier magnitude',
  finalNorm: 'Final layer L2 norm', gradRatio: 'Gradient norm ratio', cosine: 'Signal cosine', saved: 'RMSNorm FLOPs saved',
  savedHint: '{rms} vs {ln} scalar operations per 32-channel vector, excluding affine parameters.',
  gradHint: 'Input gradient norm divided by output gradient norm for the first output channel.',
  guide: 'The backward chart differentiates the first output channel through every layer. The identity path adds its gradient to the branch gradient, so direction matters as well as magnitude.',
  symmetry: 'With pre-LayerNorm and residuals, shifting every input channel by the same constant also shifts the output by that constant. This protects the uniform-shift direction. The plotted single-channel gradient is measured directly.',
  comparison: 'LayerNorm subtracts the channel mean before rescaling. RMSNorm rescales around zero. A spike in one channel therefore changes the other channels differently.',
  limited: 'Numerical limit reached: branch outputs at ±10¹² are clipped, with a zero derivative on saturated channels.',
  missions: {
    divergence: { title: 'Watch the signal diverge', description: 'Disable the residual and normalization for at least 16 layers. Reach a final/input norm ratio above 10 or below 0.05.',
      insight: 'Without a skip or normalization, each layer sends its full output through another projection and activation. Repeated gain or attenuation compounds with depth.' },
    rescue: { title: 'Rescue the gradient', description: 'Use Pre-Norm with a residual for at least 24 layers. Aim for a gradient norm ratio between 0.2 and 5. On the Modern LLM preset, try a weight gain near 0.6.',
      insight: 'Normalizing the branch input regulates its scale. The residual also passes a copy of the incoming gradient directly backward.' },
    outlier: { title: 'Compare outlier responses', description: 'Raise the input spike to at least 10 and switch between LayerNorm and RMSNorm. Inspect the 32 channels at layer zero.',
      insight: 'The same outlier increases both normalization denominators. LayerNorm also shifts every channel by a shared mean; RMSNorm preserves each input sign.' },
  },
} as const

const zh: ExactStringTree<typeof en> = {
  presets: { modern: '现代大模型 · 前置 RMSNorm', classic: '经典 Transformer · 后置 LayerNorm', exploding: '深层网络爆炸', outlier: '离群值压力测试' },
  numLayers: '网络深度', placement: '归一化位置', placements: { 'pre-norm': '前置归一化', 'post-norm': '后置归一化', none: '无归一化' },
  normType: '归一化方式', norms: { layernorm: 'LayerNorm', rmsnorm: 'RMSNorm' }, useResidual: '残差连接',
  activation: '激活函数', weightGain: '权重增益', outlierMag: '离群值幅度',
  finalNorm: '末层 L2 范数', gradRatio: '梯度范数比', cosine: '信号余弦相似度', saved: 'RMSNorm 节省的运算数',
  savedHint: '每个 32 通道向量需 {rms} 次与 {ln} 次标量运算，未计仿射参数。',
  gradHint: '对输出的第一个通道求导，计算输入端与输出端的梯度范数之比。',
  guide: '反向曲线从第一个输出通道出发，逐层求导。恒等路径的梯度与分支梯度相加，最终结果既取决于大小，也取决于方向。',
  symmetry: '使用前置 LayerNorm 和残差时，给所有输入通道加同一个常数，输出也平移同一个常数，因此均匀平移方向得以保留。图中的单通道梯度则由逐层求导得到。',
  comparison: 'LayerNorm 先减去通道均值再缩放，RMSNorm 围绕零点缩放。单个通道出现尖峰时，两种方式对其他通道的影响随之不同。',
  limited: '已达到数值上限。分支输出在 ±10¹² 处截断，饱和通道的局部导数为零。',
  missions: {
    divergence: { title: '观察信号发散', description: '选择至少 16 层，关闭归一化与残差，让末层与输入范数之比超过 10 或低于 0.05。',
      insight: '关闭残差和归一化后，每层都把完整输出送入下一组投影与激活。多层增益或衰减会逐步累积。' },
    rescue: { title: '挽救反向梯度', description: '在至少 24 层的模型中启用前置归一化和残差，使梯度范数比位于 0.2 至 5 之间。使用现代大模型预设时，可尝试接近 0.6 的权重增益。',
      insight: '归一化控制了分支输入尺度。残差连接还能在反向传播时直接传递一份传入梯度。' },
    outlier: { title: '比较离群值响应', description: '让输入尖峰幅度达到至少 10，并切换 LayerNorm 和 RMSNorm。检查第零层的 32 个通道。',
      insight: '同一个尖峰会增大两种归一化的分母。LayerNorm 还会从每个通道减去共同的均值，RMSNorm 则保留各输入值的符号。' },
  },
}

export const normalCopy = { en, zh }
