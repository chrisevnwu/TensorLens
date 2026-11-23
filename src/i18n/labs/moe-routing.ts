import type { ExactStringTree } from '../types'

const en={
  presets:{balanced:'Balanced Mixtral-style',collapse:'Expert collapse',tight:'Tight capacity',lossfree:'DeepSeek loss-free bias'},
  numTokens:'Tokens per batch',numExperts:'Experts',topK:'Experts per token',capacity:'Capacity factor',mode:'Balancing method',
  modes:{none:'None','aux-loss':'Auxiliary loss','loss-free-bias':'Loss-free bias'},alpha:'Auxiliary loss weight',noise:'Router noise',
  dropped:'Dropped routes',fullyDropped:'Fully dropped tokens',cv:'Expert load CV',aux:'Auxiliary loss',active:'Active expert fraction',
  routeHint:'Fraction of all requested expert assignments rejected at capacity.',
  tokenHint:'All K routes were rejected for these tokens. They continue through the residual path.',
  loadHint:'Standard deviation / mean of requested loads, before capacity clipping.',
  activeHint:'Fraction of equal-sized expert parameters selected per token.',
  guides:{
    none:'The unbalanced training rule reinforces popular experts. Increasing concentration before the capacity limit can cause rejected routes even while other experts have room.',
    'aux-loss':'The router takes a gradient step on the Switch auxiliary loss. Assignment fractions are held fixed during this step; gradients flow through the mean softmax probabilities.',
    'loss-free-bias':'Each expert receives a small selection-bias update from its load imbalance. Bias changes the ranking for Top-K. The softmax probabilities and gate weights still come from the original router.',
  },
  capacityGuide:'Each expert admits its highest-probability requests first. A dropped route contributes no expert output. A token with another accepted route still uses that expert.',
  missions:{
    collapse:{title:'Trigger expert collapse',description:'Use no balancing for at least 15 steps. Reach a 45% share of all requests for a single expert.',
      insight:'Training reinforces already-popular experts and separates their probabilities further. The request distribution can collapse even when accepted loads are capped.'},
    'no-drops':{title:'Eliminate dropped routes',description:'Reach step 10 or later with auxiliary loss or loss-free bias. Keep capacity factor at or below 1.25 and admit every requested route.',
      insight:'Spreading demand can eliminate overflows without provisioning extra expert slots.'},
    sparse:{title:'Compare sparse and dense compute',description:'Choose eight experts and activate two per token. Check the active expert fraction.',
      insight:'Each token selects 2/8 of the expert bank. Different tokens in the same batch can still activate different expert pairs.'},
  },
} as const
const zh:ExactStringTree<typeof en>={
  presets:{balanced:'Mixtral 式均衡路由',collapse:'专家坍缩',tight:'紧容量路由',lossfree:'DeepSeek 无损失偏置'},
  numTokens:'每批词元数',numExperts:'专家数',topK:'每个词元选择的专家数',capacity:'容量因子',mode:'负载均衡方式',
  modes:{none:'无均衡','aux-loss':'辅助损失','loss-free-bias':'无损失偏置'},alpha:'辅助损失权重',noise:'路由噪声',
  dropped:'丢弃路径比例',fullyDropped:'全部路径被丢弃的词元',cv:'专家负载变异系数',aux:'辅助损失',active:'激活专家比例',
  routeHint:'所有专家分配请求中，因专家容量用尽而被拒绝的比例。',tokenHint:'这些词元的全部 K 条路径均被拒绝，沿残差路径继续传递。',
  loadHint:'应用容量限制之前，请求数的标准差与均值之比。',activeHint:'每个词元选择的等规模专家参数比例。',
  guides:{
    none:'未经均衡的训练规则会强化热门专家。容量限制前的请求越来越集中，即使其他专家仍有空位，也可能出现路径丢弃。',
    'aux-loss':'路由器沿 Switch 辅助损失梯度更新。单次更新把离散分配比例视作常量，梯度经由平均 Softmax 概率传回路由器。',
    'loss-free-bias':'各专家根据负载偏差小幅更新选择偏置。偏置改变 Top-K 的排名，Softmax 概率和门控权重仍取自原始路由器。',
  },
  capacityGuide:'各专家按路由概率从高到低接收请求。被丢弃的路径没有专家输出；词元若还有其他被接收的路径，仍能使用对应专家。',
  missions:{
    collapse:{title:'触发专家坍缩',description:'关闭均衡并推进至少 15 步，使某个专家获得全部请求的至少 45%。',
      insight:'训练会强化已有高负载专家，进一步拉开概率差距。即使实际接收量受容量限制，请求仍可能集中到极少数专家。'},
    'no-drops':{title:'消除路径丢弃',description:'启用辅助损失或无损失偏置并推进至少 10 步。保持容量因子不超过 1.25，使所有请求都被接收。',
      insight:'分散请求需求可以在不增加专家容量的条件下消除溢出。'},
    sparse:{title:'比较稀疏与稠密计算',description:'选择八个专家，让每个词元激活其中两个，并查看激活专家比例。',
      insight:'单个词元仅选择专家库中的 2/8。同一批次中的其他词元仍可能选择不同的专家组合。'},
  },
}

export const moeCopy={en,zh}
