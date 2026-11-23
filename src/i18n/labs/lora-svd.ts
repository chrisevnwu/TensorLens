import type { ExactStringTree, Locale } from '../types'
const en={
  presets:{intrinsic:'Intrinsic low-rank task',stress:'High-rank stress test',broken:'Broken initialization',budget:'70B QLoRA budget'},
  rank:'Adapter rank',alpha:'LoRA alpha',zero:'Initialize B to zero',target:'Target update',
  targets:{'low-rank':'Intrinsic low rank','attention-shift':'Structured attention shift','full-rank':'Full-rank random noise'},model:'Model size',
  trainable:'Trainable parameters',nearlyAll:'Over 99.99%',energy:'Explained energy',mse:'LoRA reconstruction MSE',floor:'SVD optimal MSE',savings:'QLoRA memory savings',
  paramsHint:'{adapter} trainable factors out of {total} toy parameters, including the frozen base.', savingsHint:'Relative to full BF16 fine-tuning for the selected model size.',
  fit:'An adapter fits the desired update ΔW. The full layer becomes W₀ + (α/r)BA. The frozen base is identical at every training step.',
  lineSearch:'Each step updates B, recomputes the residual, then updates A. For each factor, the other is held fixed and an exact line search minimizes the quadratic loss along the gradient direction.',
  zeroGuide:'A starts with Kaiming-normal entries. With B = 0 the adapter initially changes no weights, but B can already receive a nonzero gradient.',
  memoryGuide:'The production estimate adapts Q and V projections in each layer. Activation memory assumes one sequence of 2,048 tokens. The toy matrix and the model-size calculator use different parameter counts.',
  missions:{
    energy:{title:'Capture 95% of the update',description:'On the intrinsic low-rank target, find a rank of four or less that captures at least 95% of the squared singular values.',
      insight:'On this target most update energy lies in a few singular directions. Reducing the rank one more step shows whether the current rank is the smallest one that meets the threshold.'},
    floor:{title:'Approach the optimal rank bound',description:'Train for at least 30 steps and bring the MSE below 1.15 times the optimal floor plus 0.0001.',
      insight:'The truncated SVD gives the best possible rank-r MSE. The challenge allows 15% relative slack plus 0.0001 for near-zero floors.'},
    failure:{title:'Find a high-rank counterexample',description:'Select the full-rank noise target at rank two and observe less than 35% captured energy.',
      insight:'A flat singular spectrum spreads energy over many independent directions. Two factors of rank two cannot capture the whole update.'},
  },
} as const
const zh:ExactStringTree<typeof en>={
  presets:{intrinsic:'内在低秩任务',stress:'高秩压力测试',broken:'非零初始化对照',budget:'70B QLoRA 显存预算'},
  rank:'适配器秩',alpha:'LoRA 缩放系数 α',zero:'将 B 初始化为零',target:'目标更新矩阵',targets:{'low-rank':'内在低秩','attention-shift':'结构化注意力偏移','full-rank':'满秩随机噪声'},model:'模型规模',
  trainable:'可训练参数',nearlyAll:'高于 99.99%',energy:'捕获能量',mse:'LoRA 重建均方误差',floor:'SVD 最优均方误差',savings:'QLoRA 显存节省比例',
  paramsHint:'含冻结基座在内的小模型共有 {total} 个参数，其中 {adapter} 个来自可训练因子。',savingsHint:'相对于所选规模的 BF16 全参数微调。',
  fit:'适配器拟合目标更新 ΔW，完整层的权重变为 W₀ + (α/r)BA。各训练步使用同一组冻结基座权重。',
  lineSearch:'每步先更新 B，重新计算残差，再更新 A。更新一个因子时固定另一个因子，并沿梯度方向做精确线搜索，将该方向上的二次损失降至最低。',
  zeroGuide:'A 使用 Kaiming 正态初始化。B 初始化为零时，适配器起初不改变任何权重，但 B 仍可收到非零梯度。',
  memoryGuide:'实际规模估算针对每一层的 Q 和 V 投影进行适配。激活显存假定一个长 2,048 词元的序列。小矩阵实验与模型规模计算器分别采用各自的参数量。',
  missions:{
    energy:{title:'捕获 95% 的更新能量',description:'在内在低秩目标上，找到不超过四的秩，使保留的奇异值平方和占比至少达到 95%。',
      insight:'该目标的更新能量集中在少数奇异方向上。再把秩降低一级，即可判断当前秩是否是达到阈值的最小值。'},
    floor:{title:'接近最优秩约束下界',description:'运行至少 30 步，使均方误差不高于最优下界的 1.15 倍加 0.0001。',
      insight:'截断 SVD 给出秩为 r 时可达到的最优均方误差。挑战容许 15% 的相对误差，并为接近零的下界额外保留 0.0001 的绝对容差。'},
    failure:{title:'寻找低秩反例',description:'在满秩随机噪声目标上选择秩为二，并观察捕获能量低于 35%。',
      insight:'平坦的奇异值谱把能量分散到多个独立方向。秩为二的适配器无法捕获整个更新。'},
  },
}

export const loraCopy={en,zh}

export function formatExplainedEnergy(energy: number, locale: Locale) {
  const precision = { style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2 } as const
  const display = energy.toLocaleString(locale, precision)
  return energy < 1 && display === (1).toLocaleString(locale, precision) ? loraCopy[locale].nearlyAll : display
}
