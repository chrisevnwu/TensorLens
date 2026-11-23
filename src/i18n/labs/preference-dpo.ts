import type { ExactStringTree } from '../types'

const en = {
  presets: { consensus: 'Unanimous votes', split: 'Split vote', reversal: 'Overturn the reference' },
  votesA: 'Votes for A out of 20', referenceA: 'Frozen reference P(A)', beta: 'Preference scale β', rate: 'Learning rate η',
  prompt: 'Summarize the test result', context: 'Accuracy increased from 70% to 82%.',
  answerA: 'Accuracy rose by 12 percentage points.', answerB: 'The updated model answered more questions correctly.',
  voteCount: '{count} of 20 prefer {answer}', policyNow: 'Current policy', reference: 'Frozen reference',
  generation: 'Which answer will the policy generate?', plot: 'Training curve',
  modes: { policy: 'Answer probability', fit: 'Preference fit', loss: 'Loss' },
  step: 'Gradient update', policyCurve: 'Probability of generating A (%)', policySeries: 'Policy P(A)', referenceSeries: 'Reference P(A)',
  fitCurve: 'Probability of a vote for A (%)', fitSeries: 'DPO prediction', voteSeries: 'Observed vote share',
  lossCurve: 'Mean preference loss (nats)', lossSeries: 'Mean loss',
  lossMetric: 'Mean DPO loss', klMetric: 'KL from the reference', marginMetric: 'Preference margin', predictedMetric: 'Predicted votes for A',
  marginHint: 'β times the change in A-versus-B log odds.', klHint: 'KL(policy ∥ reference), in nats.',
  computation: 'One full-batch update', theta: 'Policy log odds θ', gradient: 'Loss gradient ∂L/∂θ',
  ifA: 'Loss when A wins', ifB: 'Loss when B wins', update: 'Update rule',
  guide: 'This policy chooses between two complete answers to one prompt. A single parameter θ equals log[P(A)/P(B)]. Training starts from the frozen reference. Each update averages the preferences of 20 illustrative voters.',
  fitGuide: 'DPO predicts how often A wins a pairwise comparison using the change in policy log odds relative to the reference. At initialization the predicted vote is 50%, even when the reference usually generates A.',
  scaleGuide: 'With votes on both sides, the loss is smallest when the predicted vote share matches the observed one. Increasing β requires a smaller change in policy log odds to reach that same fit.',
  missions: {
    consensus: { title: 'Turn consensus into probability', description: 'Give A all 20 votes and train until the policy generates A at least 90% of the time.', insight: 'Every comparison pushes the log odds in the same direction. Once A leads strongly, each additional update has a smaller gradient.' },
    split: { title: 'Fit a divided panel', description: 'Give A 15 votes. Select Preference fit and train until the predicted vote share is within one percentage point of 75%.', insight: 'Fitting 15 out of 20 comparisons leaves a nonzero loss because the other five voters preferred B.' },
    reversal: { title: 'Reverse the majority answer', description: 'Start with a reference that generates A at least 80% of the time. Give B the majority and train until the policy generates A at most 45% of the time.', insight: 'The preference labels can move the policy past equal odds. KL quantifies how far the new distribution has moved from the frozen reference.' },
  },
} as const

const zh: ExactStringTree<typeof en> = {
  presets: { consensus: '全票支持', split: '偏好分歧', reversal: '反转参考策略' },
  votesA: '20 票中支持 A 的票数', referenceA: '参考策略的 P(A)', beta: '偏好尺度 β', rate: '学习率 η',
  prompt: '用一句话概括测试结果', context: '准确率从 70% 提高到 82%。',
  answerA: '准确率提高了 12 个百分点。', answerB: '更新后的模型答对了更多问题。',
  voteCount: '20 票中有 {count} 票支持 {answer}', policyNow: '当前策略', reference: '冻结的参考策略',
  generation: '策略会生成哪条回答？', plot: '训练曲线',
  modes: { policy: '回答概率', fit: '偏好拟合', loss: '损失' },
  step: '梯度更新次数', policyCurve: '生成回答 A 的概率（%）', policySeries: '策略 P(A)', referenceSeries: '参考 P(A)',
  fitCurve: '投票支持 A 的概率（%）', fitSeries: 'DPO 预测', voteSeries: '实际票数占比',
  lossCurve: '平均偏好损失（nat）', lossSeries: '平均损失',
  lossMetric: '平均 DPO 损失', klMetric: '相对参考策略的 KL 散度', marginMetric: '偏好间隔', predictedMetric: '预测的 A 得票率',
  marginHint: 'A 相对 B 的对数几率变化量乘以 β。', klHint: 'KL（当前策略 ∥ 参考策略），单位为 nat。',
  computation: '一次全批量梯度更新', theta: '策略对数几率 θ', gradient: '损失梯度 ∂L/∂θ',
  ifA: 'A 胜出时的损失', ifB: 'B 胜出时的损失', update: '更新公式',
  guide: '同一条提示有两条完整回答。策略只学习一个参数 θ，即 log[P(A)/P(B)]。训练从冻结的参考策略出发，每次更新都计算这 20 个示例偏好标签的平均损失。',
  fitGuide: 'DPO 根据当前策略相对参考策略的对数几率变化，预测一票会支持 A 的概率。刚开始训练时，即使参考策略经常生成 A，预测的 A 得票率也恰好是 50%。',
  scaleGuide: '两边都有选票时，预测得票率等于实际比例，损失达到最小值。此时增大 β，策略只需更小的对数几率变化就能拟合同一组投票。',
  missions: {
    consensus: { title: '把全票支持转化为生成概率', description: '让 A 获得全部 20 票，训练到策略生成 A 的概率至少为 90%。', insight: '每一票都推动对数几率向同一方向变化。当 A 已经明显领先，后续每次更新的梯度会变小。' },
    split: { title: '拟合有分歧的投票', description: '给 A 15 票，选择「偏好拟合」。训练到预测得票率与 75% 相差不超过一个百分点。', insight: '即使模型准确拟合了 15 比 5 的投票比例，损失仍大于零，因为另外 5 票支持 B。' },
    reversal: { title: '反转生成概率', description: '让参考策略生成 A 的概率至少为 80%。把多数票给 B，训练到当前策略生成 A 的概率不超过 45%。', insight: '这些偏好标签推动策略越过了五五开的分界。KL 散度衡量当前分布相对冻结参考分布偏移了多少。' },
  },
}

export const dpoCopy = { en, zh }
