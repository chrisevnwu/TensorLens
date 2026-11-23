/** Input data for the experiments. Display names are supplied by the lab's dictionaries. */
export const BPE_PRESETS = [
  {
    id: 'multilingual',
    corpus: [
      '语言模型学习语言。语言模型观察世界。模型学习语言，模型学习世界。',
      '语言模型🚀 语言模型🚀 语言模型🚀 语言模型🚀',
      'Language models learn language. Models learn from language.',
      'for word in words:\n    print(word, "语言模型🚀")',
    ].join('\n'),
    prompt: '语言模型🚀语言模型🚀',
    numMerges: 20, preTokenize: true, showByteHex: false,
  },
  {
    id: 'code',
    corpus: [
      'def encode(rows):',
      '    result = []',
      '    for row in rows:',
      '        result.append({"id": row["id"], "x": row["x"]})',
      '    return result',
      'def decode(rows):',
      '    result = []',
      '    for row in rows:',
      '        result.append([row["id"], row["x"]])',
      '    return result',
    ].join('\n'),
    prompt: '    for row in rows:\n        result.append(row["id"])',
    numMerges: 20, preTokenize: true, showByteHex: true,
  },
  {
    id: 'morphology',
    corpus: 'play playing played player replay replaying replayed players. ' +
      'train training trained trainer retrain retraining retrained trainers. ' +
      '2026 + 2026 = 4052; 99999 + 1 = 100000. 2026 2026 99999 99999.',
    prompt: 'replaying 2026 + 99999',
    numMerges: 20, preTokenize: true, showByteHex: false,
  },
] as const

export type BpePresetId = typeof BPE_PRESETS[number]['id']
