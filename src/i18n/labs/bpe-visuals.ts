import type { ExactStringTree } from '../types'

const en = {
  stream: 'Token stream', promptEmpty: 'Enter a test prompt to inspect its tokens.',
  decoded: 'Decoded prompt', token: 'Token', tokens: 'Tokens', bytes: 'Bytes', tree: 'Merge tree',
  noSelection: 'Select a token to inspect its merge tree.', depth: 'Depth', raw: 'Raw byte',
  chart: 'Training corpus · compression', ratio: 'Chars / token', step: 'Merge step',
  highlights: 'Merged pairs in the corpus', initial: 'Initial byte vocabulary',
  occurrences: 'Replacements', emptyCorpus: 'Enter a training corpus to learn merges.',
  rawFragment: 'A merge splits this character. Its exact UTF-8 bytes are shown.',
} as const
const zh: ExactStringTree<typeof en> = {
  stream: '词元序列', promptEmpty: '输入测试文本即可检查词元。',
  decoded: '解码文本', token: '词元', tokens: '词元数', bytes: '字节', tree: '合并树',
  noSelection: '选择词元以查看其合并树。', depth: '深度', raw: '原始字节',
  chart: '训练语料压缩曲线', ratio: '字符数 / 词元', step: '合并步数',
  highlights: '语料中的合并位置', initial: '初始字节词表',
  occurrences: '替换次数', emptyCorpus: '输入训练语料即可学习合并规则。',
  rawFragment: '合并边界穿过此字符，已显示其确切的 UTF-8 字节。',
}

export const bpeVisuals = { en, zh }
