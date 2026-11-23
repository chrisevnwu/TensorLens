import type { ExactStringTree } from '../types'

const en = {
  presets: { multilingual: 'Multilingual Compare', code: 'Code Indentation', morphology: 'Morphology & Numbers' },
  corpus: 'Training corpus', prompt: 'Test prompt', budget: 'Merge budget',
  preTokenize: 'Pre-tokenize word boundaries', showByteHex: 'Show UTF-8 bytes',
  tokenCount: 'Prompt tokens', utf8Bytes: 'UTF-8 bytes', charsPerToken: 'Characters / token',
  vocabSize: 'Vocabulary size', byteRatio: 'Bytes / token',
  before: 'At step zero each token is a single UTF-8 byte. A Chinese character or an emoji can occupy several chips. Inspect one to see its byte value.',
  merge: 'This rule joins tokens {left} and {right} into token {newId}. The pair occurred {count} times in the training corpus and was replaced at {applied} non-overlapping positions.',
  deployment: 'A language model uses a fixed vocabulary learned on training text. The test prompt uses the same merge order, so unfamiliar words can still be encoded and decoded byte for byte.',
  missions: {
    bytes: { title: 'Measure the UTF-8 tax', description: 'Inspect a Chinese or emoji-rich prompt at step zero. Reach at least 2 UTF-8 bytes per character.',
      insight: 'UTF-8 assigns multiple bytes to these code points. Before training, each byte consumes one token.' },
    compress: { title: 'Double the compression', description: 'Advance through merges until the prompt averages at least 2.2 bytes per token.',
      insight: 'Frequent adjacent pieces acquire one vocabulary ID. The prompt has fewer tokens while its decoded bytes stay identical.' },
    inspect: { title: 'Inspect a recursive merge', description: 'Select a prompt token whose merge tree is at least three levels deep.',
      insight: 'A learned token may contain other learned tokens. Following the branches recovers the original UTF-8 bytes.' },
  },
} as const

const zh: ExactStringTree<typeof en> = {
  presets: { multilingual: '多语言对比', code: '代码缩进', morphology: '词形与数字' },
  corpus: '训练语料', prompt: '测试文本', budget: '合并次数上限',
  preTokenize: '按词边界预切分', showByteHex: '显示 UTF-8 字节',
  tokenCount: '测试文本词元数', utf8Bytes: 'UTF-8 字节数', charsPerToken: '平均字符数 / 词元',
  vocabSize: '词表大小', byteRatio: '平均字节数 / 词元',
  before: '第零步的每个词元对应一个 UTF-8 字节。一个汉字或表情符号可能拆成多个词元。选中词元即可检查字节值。',
  merge: '本次规则把词元 {left} 与 {right} 合成词元 {newId}。这对词元在语料中相邻出现 {count} 次，实际替换了 {applied} 个互不重叠的位置。',
  deployment: '语言模型使用从训练文本中学到的固定词表。测试文本沿用同样的合并顺序，因此即使遇到陌生词，也能逐字节编码并还原。',
  missions: {
    bytes: { title: '测量 UTF-8 编码开销', description: '在第零步检查包含汉字或表情符号的文本，使每个字符平均占用至少 2 个 UTF-8 字节。',
      insight: '这些码点的 UTF-8 表示占用多个字节。训练前，每个字节都需要一个词元。' },
    compress: { title: '让压缩率翻倍', description: '逐步合并，让测试文本的每个词元平均容纳至少 2.2 个字节。',
      insight: '频繁相邻的片段共用一个新词元编号。文本的词元数减少，解码后的字节仍然完全相同。' },
    inspect: { title: '追溯递归合并', description: '选中一个合并树深度至少为三层的测试文本词元。',
      insight: '合并得到的词元还能继续参与合并。沿树枝逐层展开，就能找到最初的 UTF-8 字节。' },
  },
}

export const bpeCopy = { en, zh }
