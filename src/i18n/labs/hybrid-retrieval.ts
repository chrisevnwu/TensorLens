import type { ExactStringTree } from '../types'

const en = {
  presets: { 'error-code': 'Exact error code', synonym: 'Paraphrased query', mixed: 'Code and symptom' },
  queries: { 'error-code': 'How do I reset E17?', synonym: 'The fastener is jammed. How do I get my bike out?', mixed: 'My bike shows E17 and has no power.' },
  docs: {
    D01: 'Reset the E17 display', D02: 'Inspect battery contacts after E17',
    D03: 'Test the battery charger', D04: 'Free the dock latch', D05: 'Release a bike from the station rack', D06: 'Read a blinking display',
  },
  method: { bm25: 'BM25', cosine: 'Cosine', rrf: 'Rank fusion' },
  batteryWeight: 'Battery weight in query', queryVector: 'Query', query: 'Help desk query', terms: 'Indexed terms', queryTerms: 'Query terms', diagram: 'Document rankings',
  instruction: 'Select a document to follow it across lists. Select a column heading to inspect that method.',
  ranks: 'Rank', score: 'Score', absent: 'No matches', cutoff: 'Result limit (K)', constant: 'Fusion constant (c)',
  available: 'Documents retrieved', recalled: 'Relevant documents found', recall: 'Recall@K',
  precision: 'Precision@K', precisionHint: 'Relevant results divided by K. Unfilled positions count as misses.',
  judged: 'Relevant documents', inspect: 'Inspect document', judgedRelevant: 'Relevant', judgedOther: 'Outside relevance set',
  top: 'Top K', matches: 'Term evidence', term: 'Term', frequency: 'TF', corpusFrequency: 'DF', contribution: 'BM25 term score',
  vectors: 'Topic weights', axisCode: 'Fault codes', axisBattery: 'Battery', axisDock: 'Docking',
  model: 'Six bicycle repair notes share one English index. The three topic weights are assigned by hand. You can change the query’s battery weight. Its relevance labels stay fixed.',
  guides: {
    bm25: 'BM25 sums matches on distinct query terms. Rare terms carry more weight. Repeated occurrences saturate, and longer notes receive length normalization. Here k₁ = 1.2 and b = 0.75.',
    cosine: 'Cosine compares the direction of the query and document vectors. Notes can share a topic even when their indexed words differ. Inspect the three coordinates to see what each vector encodes.',
    rrf: 'Each list contributes 1/(c + rank), starting with rank 1. A missing document contributes zero. Increasing c reduces the difference between high and low ranks. K limits the evaluated results after fusion.',
  },
  policy: 'Only positive scores enter a list. Equal scores use ascending document ID. The marked documents are the relevance labels used for recall.',
  votes: 'Fusion contributions', sum: 'Sum',
  missions: {
    exact: { title: 'Find the reset note', description: 'With the exact code query, take the top BM25 result at K = 1 and inspect D01.', insight: 'The code and reset term identify the relevant support note at the first rank.' },
    synonym: { title: 'Recover two missed notes', description: 'Use the paraphrased query, inspect its cosine ranking and set K = 2 to retrieve both relevant notes.', insight: 'No query term occurs in the index. The docking coordinate places both release notes in the top two.' },
    consensus: { title: 'Promote the shared runner-up', description: 'With the code and symptom query, inspect D02 in rank fusion at K = 1.', insight: 'D02 places second on both lists. Its combined votes beat the separate lexical and topic winners.' },
  },
} as const

const zh: ExactStringTree<typeof en> = {
  presets: { 'error-code': '精确故障码', synonym: '同义改写', mixed: '故障码与症状' },
  queries: { 'error-code': '如何重置 E17？', synonym: '固定件卡住了，怎样取出单车？', mixed: '单车显示 E17，而且没电了。' },
  docs: {
    D01: '重置 E17 显示屏', D02: '出现 E17 后检查电池触点',
    D03: '检测电池充电器', D04: '松开车桩锁扣', D05: '从停车架释放单车', D06: '识别显示屏闪烁提示',
  },
  method: { bm25: 'BM25', cosine: '余弦相似度', rrf: '排名融合' },
  batteryWeight: '查询中的电池权重', queryVector: '查询', query: '报修问题', terms: '索引词', queryTerms: '查询词', diagram: '文档排名',
  instruction: '选择文档可追踪它在各列表中的名次。选择列标题可查看对应方法。',
  ranks: '名次', score: '分数', absent: '无匹配', cutoff: '返回数量（K）', constant: '融合常数（c）',
  available: '返回文档数', recalled: '命中相关文档', recall: '召回率 Recall@K',
  precision: '精确率 Precision@K', precisionHint: '前 K 位的相关结果数除以 K，空位也计入分母。',
  judged: '相关文档', inspect: '查看文档', judgedRelevant: '相关', judgedOther: '未标为相关',
  top: '前 K 名', matches: '词项匹配', term: '词项', frequency: '词频', corpusFrequency: '文档频数', contribution: 'BM25 贡献',
  vectors: '主题权重', axisCode: '故障码', axisBattery: '电池', axisDock: '车桩',
  model: '六篇单车维修资料共用一个英文索引。三个主题的权重由人工指定，你可以调整查询中的电池权重，相关文档标注保持固定。',
  guides: {
    bm25: 'BM25 对查询中的不同词项分别计分。稀有词权重更高，词频增长带来的收益逐渐减小，较长文档会做长度归一化。本实验使用 k₁ = 1.2、b = 0.75。',
    cosine: '余弦相似度比较查询与文档向量的方向。索引词不同的资料也可以讨论同一主题。查看三个坐标即可核对各自的主题构成。',
    rrf: '每个列表按 1/(c + 名次) 投票，首名的名次为 1，缺席的文档贡献为零。增大 c 会缩小相邻名次的得分差异。K 决定融合后取多少条结果来评估。',
  },
  policy: '只有正分文档进入对应列表。同分按文档编号升序排列。标注为相关的文档用于计算召回率。',
  votes: '融合分数来源', sum: '合计',
  missions: {
    exact: { title: '找到重置说明', description: '选择精确故障码，把 K 设为 1，在 BM25 列查看首位文档 D01。', insight: '故障码和重置词项一起把相关说明排在第一位。' },
    synonym: { title: '找回两篇漏检资料', description: '选择同义改写，查看余弦排名，把 K 设为 2，找回两篇相关资料。', insight: '查询词均未出现在索引里。车桩主题的权重让两篇取车资料排在前两位。' },
    consensus: { title: '让两路的第二名胜出', description: '选择故障码与症状，把 K 设为 1，在排名融合列查看 D02。', insight: 'D02 在两个列表中均居第二，两票相加后超过了词项与向量各自的首名。' },
  },
}

export const retrievalCopy = { en, zh }
export type RetrievalCopy = ExactStringTree<typeof en>
