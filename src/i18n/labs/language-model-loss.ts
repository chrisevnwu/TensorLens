import type { ExactStringTree } from '../types'

const en = {
  presets: { walkthrough: 'Follow the melody', uniform: 'Four equally likely notes', overconfident: 'One costly mistake' },
  gap: 'Logit gap for the expected note', include: 'Score the selected position',
  model: 'Current model', reference: '50% reference', perPosition: 'Loss at each observed note',
  axis: 'nats', position: 'Position', loss: 'Loss', excluded: 'Excluded', scored: 'Scored',
  steps: 'Select a position', observed: 'Observed', predicted: 'Top prediction', following: 'Next note after',
  sequenceLabel: 'Observed sequence', distribution: 'Next-note probabilities',
  referenceKey: 'The vertical mark shows the reference probability', comparison: 'Whole-sequence scores',
  accuracy: 'Top-1 accuracy', meanLoss: 'Nats / token', perplexity: 'Perplexity', tokens: 'Scored positions',
  likelihood: 'Observed probability', totalLoss: 'Sum of scored losses (nats)',
  ruleText: 'The model favors the next note in the cycle C → D → E → G → C. Its favored note receives the logit gap and the three others receive zero. Each prediction uses the previous observed note. The reference always assigns 50% to the favored note.',
  ties: 'With a zero gap all four notes tie. The top-1 score uses the first note, C.',
  guide: 'This experiment scores what actually happened. Average −ln p over the enabled targets, then exponentiate to get the sequence perplexity. The sampling lab instead exponentiates the entropy of one predicted distribution.',
  noTargets: 'Select a position and enable scoring to calculate a sequence average.',
  missions: {
    uniform: { title: 'Recover the vocabulary size', description: 'Set the gap to zero, score all seven positions and inspect the final note.', insight: 'Each observed note gets probability ¼. Its loss is ln 4, and the sequence perplexity is exactly 4.' },
    error: { title: 'Find an expensive mistake', description: 'Score all seven positions, set the gap to 8 and inspect the last note. Compare both models’ accuracy and mean loss.', insight: 'Both models get six answers right. The current model gives the final C so little probability that its mean loss exceeds the reference.' },
    mask: { title: 'Measure the cost of exclusion', description: 'With gap 8, exclude only the final position. Bring perplexity below 1.01.', insight: 'Excluding the surprise removes its loss and one scored position. The predictions stay identical while the evaluation sample gets easier.' },
  },
} as const
const zh: ExactStringTree<typeof en> = {
  presets: { walkthrough: '跟着旋律预测', uniform: '四个音符等概率', overconfident: '一次代价高昂的误判' },
  gap: '预期音符的分数优势', include: '将选中位置计入评分',
  model: '当前模型', reference: '50% 参考模型', perPosition: '各位置真实音符的损失',
  axis: '纳特', position: '位置', loss: '损失', excluded: '已排除', scored: '已计分',
  steps: '选择位置', observed: '实际音符', predicted: '首选预测', following: '预测下一音符，前一音符为',
  sequenceLabel: '实际序列', distribution: '下一音符的预测概率',
  referenceKey: '竖线表示参考模型的概率', comparison: '整段序列的评分',
  accuracy: '首选命中率', meanLoss: '纳特 / 词元', perplexity: '困惑度', tokens: '计分位置数',
  likelihood: '实际音符的预测概率', totalLoss: '计分位置的损失总和（纳特）',
  ruleText: '模型按照 C → D → E → G → C 的循环预测。预期音符的分数等于滑块的值，另外三个音符的分数都是零。每一步都以前一个真实音符为条件。参考模型始终给预期音符 50% 的概率。',
  ties: '分数优势为零时，四个音符并列。计算首选命中率时，取词表中排在第一位的 C。',
  guide: '本实验对序列中实际出现的目标评分。将计分位置的 −ln p 取平均，再求指数，就得到序列困惑度。采样实验则对单个预测分布的熵取指数。',
  noTargets: '请选中一个位置并开启计分，以计算序列平均值。',
  missions: {
    uniform: { title: '用困惑度找回词表大小', description: '将分数优势设为零，对七个位置全部计分，再查看最后一个音符。', insight: '每个真实音符都获得 ¼ 的概率，损失为 ln 4，整段的困惑度恰好等于 4。' },
    error: { title: '找到最贵的一次误判', description: '对七个位置全部计分，将分数优势设为 8，再查看最后一个音符。比较两个模型的命中率与平均损失。', insight: '两个模型都猜对了六个音符。当前模型给最后一个 C 的概率极低，足以让整段平均损失高于参考模型。' },
    mask: { title: '测量剔除一个位置的影响', description: '保持分数优势为 8，只排除最后一个位置，让困惑度降到 1.01 以下。', insight: '剔除意外音符，会同时减去它的损失和一个计分位置。预测完全相同，但评估样本变得更容易。' },
  },
}
export const lossCopy = { en, zh }
