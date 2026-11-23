import type { ExactStringTree } from '../types'

const en = {
  presets: { 'hard-target': 'Hard label only', 'soft-targets': 'Learn the runner-up', 'swap-runner-up': 'Swap the runner-up' },
  alpha: 'Soft-target weight α', temperature: 'Training temperature T', tail: 'Teacher viola score b',
  question: 'Which instrument played the note?', context: 'The example is labeled violin. How much probability should the other instruments receive?',
  classes: { violin: 'Violin', viola: 'Viola', trumpet: 'Trumpet' },
  hardLabel: 'Labeled class', compare: 'Compare distributions', modes: { predictions: 'Predictions at T = 1', training: 'Training distributions' },
  student: 'Student', baseline: 'Hard-label baseline', teacher: 'Teacher at T', studentAtT: 'Student at T',
  focus: 'Choose an instrument to inspect', curve: '{class} probability at inference (%)', step: 'Gradient update',
  loss: 'Student objective', hard: 'Hard-label loss', kl: 'Soft-target KL', gap: 'Viola minus trumpet',
  klHint: 'KL from the teacher to the student at training temperature, in nats, before multiplying by T².',
  gapHint: 'Difference between the student predictions at T = 1, in percentage points.',
  pp: 'pp', inspection: '{class} update', logit: 'Student logit z', gradient: 'Gradient ∂L/∂z', change: 'Update −η ∂L/∂z',
  scoreHint: 'Teacher scores in instrument order', learn: 'Both students start with three zero logits. The baseline learns only from the violin label. The other student mixes that label with the teacher distribution using α. At α = 1 it follows only the teacher.',
  tempGuide: 'Dividing the logits by a larger T before softmax gives the least likely class more probability and makes the distribution flatter. The T² factor compensates for the shrinking soft-target gradients at high temperatures. Predictions always use T = 1.',
  scope: 'The teacher scores are hand-set for one labeled example. Each student learns three logits directly using gradient descent with learning rate 0.5. The experiment measures the fit on this example only.',
  missions: {
    hard: { title: 'Find what a hard label can teach', description: 'Set α to 0. Train until violin reaches 90% and the two remaining instruments still have equal probability.', insight: 'Viola and trumpet start with equal scores and get identical gradients from the violin label. Every update preserves their tie.' },
    soft: { title: 'Transfer the second choice', description: 'Set α to 1, T to 2 and the viola score to 2. Train until viola leads trumpet by at least 20 percentage points.', insight: 'The teacher assigns the viola some of the probability mass. The student picks up this preference even though the example is labeled violin.' },
    swap: { title: 'Change the runner-up', description: 'Set α to 1, T to 4 and the viola score to −2. Train until trumpet leads viola by at least 20 percentage points while violin stays first.', insight: 'Swapping the teacher’s two lower scores reverses the student’s second choice. The hard-label baseline still treats both alternatives equally.' },
  },
} as const

const zh: ExactStringTree<typeof en> = {
  presets: { 'hard-target': '只用硬标签', 'soft-targets': '学习第二选择', 'swap-runner-up': '交换第二选择' },
  alpha: '软目标权重 α', temperature: '训练温度 T', tail: '教师给中提琴的分数 b',
  question: '这个音符由哪种乐器演奏？', context: '样本标签是小提琴。模型该给另两种乐器各分配多少概率？',
  classes: { violin: '小提琴', viola: '中提琴', trumpet: '小号' },
  hardLabel: '样本标签', compare: '比较概率分布', modes: { predictions: '推理预测（T = 1）', training: '训练时的分布' },
  student: '学生模型', baseline: '硬标签基线', teacher: '温度 T 下的教师', studentAtT: '温度 T 下的学生',
  focus: '选择要观察的乐器', curve: '推理时预测为{class}的概率（%）', step: '梯度更新次数',
  loss: '学生训练目标', hard: '硬标签损失', kl: '软目标 KL 散度', gap: '中提琴与小号的概率差',
  klHint: '训练温度下，从教师分布到学生分布的 KL 散度，单位为 nat，尚未乘以 T²。',
  gapHint: '学生在 T = 1 时预测为中提琴的概率减去预测为小号的概率，单位为百分点。',
  pp: '个百分点', inspection: '{class}对应的更新', logit: '学生的分数 z', gradient: '梯度 ∂L/∂z', change: '更新量 −η ∂L/∂z',
  scoreHint: '按乐器顺序排列的教师分数', learn: '两个学生模型的三个初始分数都为零。基线只使用小提琴标签。另一个学生按权重 α 混合硬标签损失和教师的软目标损失。α 为 1 时，学生完全向教师学习。',
  tempGuide: '先把分数除以 T，再计算 softmax。提高温度会增加最低分类别的概率，使分布变得更平坦。乘以 T² 可以补偿高温下软目标梯度的衰减。推理时始终使用 T = 1。',
  scope: '这个实验只用一个带标签的样本，教师分数由手动设定。学生用学习率为 0.5 的梯度下降直接学习三个分数，结果只衡量对该样本的拟合程度。',
  missions: {
    hard: { title: '看看硬标签能教会什么', description: '将 α 设为 0。训练到小提琴的概率达到 90%，并观察另外两种乐器的概率仍然相等。', insight: '中提琴和小号起点相同，小提琴标签给它们的梯度也相同，所以每一步更新后它们都保持平局。' },
    soft: { title: '让学生学会第二选择', description: '将 α 设为 1，T 设为 2，中提琴分数设为 2。训练到中提琴的概率领先小号至少 20 个百分点。', insight: '虽然样本标注为小提琴，教师仍给中提琴分配了一部分概率。学生由此学到了教师对中提琴的偏好。' },
    swap: { title: '交换教师的第二选择', description: '将 α 设为 1，T 设为 4，中提琴分数设为 −2。训练到小号的概率领先中提琴至少 20 个百分点，同时保持小提琴第一。', insight: '交换教师给两个次要类别的分数，学生的第二选择也会翻转。硬标签基线始终给这两个类别相同的概率。' },
  },
}

export const distillCopy = { en, zh }
