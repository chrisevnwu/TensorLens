import type { ExactStringTree } from '../types'

const en = {
  presets: { matched: 'Matched draft', 'missing-support': 'Missing tokens', mixed: 'Biased draft' },
  mismatch: 'Repeat bias in the draft', blockSize: 'Draft tokens per block', seed: 'Sampling seed',
  call: 'Target pass {n}', output: 'Emitted sequence', proposal: 'Proposal {n}', outcomes: 'Inspect a verification decision',
  statuses: { accepted: 'Accepted', rejected: 'Rejected', discarded: 'Discarded', correction: 'Correction', bonus: 'Bonus', direct: 'Direct draw' },
  threshold: 'Accept if u < α', skipped: 'An earlier rejection invalidated this draft prefix. No acceptance draw was made.',
  corrected: 'The first rejection ends verification. Draw from the normalized positive difference between the target and the draft.',
  extra: 'Every proposal was accepted. Draw one more token from the target after the accepted prefix.',
  final: 'Only one output slot remains. One target call fills it directly.',
  law: 'Next-token probabilities after {token}', draft: 'Draft q', target: 'Target p', residual: 'On rejection', combined: 'Final law',
  legend: 'Accepted mass', repair: 'Corrected mass', impossible: 'No rejection', token: 'Next token',
  calls: 'Target passes', baseline: 'Ordinary decoding passes', acceptance: 'Accepted / tested', wasted: 'Discarded proposals',
  baselineHint: 'One target pass per emitted token at the same output length.', wastedHint: 'Unverified suffixes after the first rejected token.',
  guide: 'Start at A and emit 16 tokens. Given the previous token, the target stays put with probability 10%, moves forward around A → B → C → A with 70%, and moves backward with 20%. Repeat bias mixes this target with a draft that always repeats the previous token.',
  blockGuide: 'One target pass scores every position along a proposed block and the next position. Select a card to inspect its prefix. Each pass reserves one output slot for a correction or bonus, shortening the last draft when necessary. Pass counts exclude draft work and timing.',
  lawGuide: 'Each final bar combines min(p, q) accepted directly with max(p − q, 0) supplied by corrections. “On rejection” shows the correction distribution conditional on a rejection. The final law matches the target even for tokens the draft never proposes.',
  missions: {
    budget: { title: 'Four passes, sixteen tokens', description: 'Match the draft to the target, set the block size to 3, and reach the end in four target passes.', insight: 'Each pass emits three accepted proposals and a bonus drawn from the target.' },
    support: { title: 'Emit a missing token', description: 'Set repeat bias to 100%. Select a correction card whose emitted token had zero draft probability.', insight: 'The residual sampler restores target probability to tokens absent from the draft.' },
    mixed: { title: 'Count the discarded work', description: 'With 50% repeat bias, finish within ten target passes and discard at least one unverified proposal. Try the Biased draft preset.', insight: 'The accepted prefix still contributes to the output when the remaining proposals are discarded.' },
  },
} as const

const zh: ExactStringTree<typeof en> = {
  presets: { matched: '草稿完全匹配', 'missing-support': '草稿缺词', mixed: '有偏草稿' },
  mismatch: '草稿重复偏置', blockSize: '每块草稿词元数', seed: '采样种子',
  call: '第 {n} 次目标模型调用', output: '已输出序列', proposal: '提议 {n}', outcomes: '选择卡片查看验证过程',
  statuses: { accepted: '接受', rejected: '拒绝', discarded: '丢弃', correction: '校正采样', bonus: '额外采样', direct: '直接采样' },
  threshold: '若 u < α 则接受', skipped: '前面的提议已被拒绝，该草稿前缀随之失效，此处没有进行接受检验。',
  corrected: '遇到首个拒绝后停止验证。从目标概率减去草稿概率的正差中，归一化采样一个词元。',
  extra: '本块提议全部被接受。在已接受的前缀之后，从目标分布额外采样一个词元。',
  final: '只剩一个输出位置，本次调用直接从目标分布采样。',
  law: '上一个词元为 {token} 时的概率', draft: '草稿分布 q', target: '目标分布 p', residual: '拒绝后采样', combined: '最终分布',
  legend: '直接接受的概率', repair: '校正补回的概率', impossible: '不会拒绝', token: '下一词元',
  calls: '目标模型调用次数', baseline: '逐词解码调用次数', acceptance: '接受数 / 检验数', wasted: '丢弃的提议数',
  baselineHint: '输出相同数量的词元时，逐词解码每个词元需要调用一次目标模型。', wastedHint: '首次拒绝后，未参与检验的草稿后缀。',
  guide: '从 A 开始输出 16 个词元。目标模型有 10% 的概率重复上一个词元，70% 的概率沿 A → B → C → A 前进，20% 的概率后退。重复偏置决定草稿将多大比例的概率分配给「总是重复上一个词元」的策略，其余部分沿用目标分布。',
  blockGuide: '目标模型一次调用即可为草稿各位置及其下一位置打分。选择卡片可以查看对应前缀。每次验证都为校正或额外采样预留一个输出位置，靠近终点时草稿块会缩短。调用次数仅统计目标模型，耗时和草稿开销另计。',
  lawGuide: '最终分布的每根条形都包含两部分：直接接受的概率 min(p, q)，以及校正补回的概率 max(p − q, 0)。「拒绝后采样」给出已知拒绝发生时的校正分布。即使草稿从不提出某个词元，最终分布仍与目标一致。',
  missions: {
    budget: { title: '四次调用，十六个词元', description: '让草稿与目标完全匹配，把草稿块长度设为 3。推进至终点，用四次目标模型调用输出全部词元。', insight: '每次调用接受三个草稿词元，并从目标分布额外采样一个词元。' },
    support: { title: '生成草稿里缺失的词元', description: '把重复偏置设为 100%，选择一张校正采样卡片，让它输出一个草稿概率为零的词元。', insight: '校正采样把草稿缺失的概率补回给目标词元。' },
    mixed: { title: '核算丢弃的草稿', description: '在 50% 重复偏置下，用十次以内的目标调用完成输出，过程中至少丢弃一个尚未验证的提议。可从「有偏草稿」开始。', insight: '即使拒绝后丢弃了草稿后缀，已接受的前缀仍会计入最终输出。' },
  },
}
export const speculativeCopy = { en, zh }
