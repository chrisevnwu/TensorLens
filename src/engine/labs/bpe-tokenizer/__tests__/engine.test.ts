import { describe, expect, it } from 'vitest'
import { decode, displayBytes, encode, metrics, tokenTree, trainBPE } from '../engine'
import { BPE_PRESETS } from '../presets'

const utf8 = new TextEncoder()

describe('byte-pair training and ranked encoding', () => {
  it('breaks equal-frequency ties using numeric pair order', () => {
    const model = trainBPE('bacab', 1, false)
    // ba, ac, ca and ab each occur once; ab is lexicographically first.
    expect(model.rules[0]).toMatchObject({
      step: 1, left: 97, right: 98, newId: 256, count: 1, bytes: [97, 98], displayText: 'ab',
    })
    expect(encode('cab', model)).toEqual([99, 256])
    // Sorting a string key such as '65,9' would rank it before '9,65'.
    expect(trainBPE('A\tA', 1, false).rules[0]).toMatchObject({ left: 9, right: 65 })
  })

  it('counts all adjacent pairs and replaces left-to-right, disjoint byte spans', () => {
    const model = trainBPE('aaaaa', 1, false)
    expect(model.rules[0]?.count).toBe(4)
    expect(encode('aaaaa', model)).toEqual([256, 256, 97])
    expect(model.timeline[1]?.occurrences).toEqual([{ start: 0, end: 2 }, { start: 2, end: 4 }])
    expect(model.timeline.map(frame => frame.tokenCount)).toEqual([5, 3])
  })

  it('retains original UTF-8 offsets through recursive merges', () => {
    const model = trainBPE('猫猫', 3, false)
    expect(encode('猫猫', model)).toHaveLength(1)
    expect(model.timeline[3]?.occurrences).toEqual([{ start: 0, end: 6 }])
  })

  it('honors the same pre-token boundary rules during training and encoding', () => {
    const split = trainBPE('abc!abc!abc!', 50, true)
    expect(split.rules.every(rule => !rule.displayText.includes('!'))).toBe(true)
    expect(encode('abc!abc!', split)).toHaveLength(4)
    const raw = trainBPE('abc!abc!abc!', 50, false)
    expect(raw.rules.some(rule => rule.displayText.includes('!'))).toBe(true)
    expect(encode('abc!abc!abc!', raw)).toHaveLength(1)
  })

  it.each([true, false])('round-trips unseen UTF-8 prompts and original BOM at every rank, presplit=%s', split => {
    const model = trainBPE('a 🚀🧠 日本語，中文!? 🚀🧠', 50, split)
    for (const prompt of ['', 'A', 'ab\t!\r\n\u0000', '简体中文', '日本語の文', '🚀🧠', '🐈‍⬛', '\uFEFFHello', 'x\uFEFFx', 'e\u0301é']) {
      for (let step = 0; step <= model.rules.length; step++) {
        expect(decode(encode(prompt, model, step), model.vocab)).toBe(prompt)
      }
      expect(encode(prompt, model, 0)).toEqual(Array.from(utf8.encode(prompt)))
    }
  })

  it.each(BPE_PRESETS)('trains $id deterministically and compresses monotonically at each rank', ({ corpus, prompt }) => {
    const model = trainBPE(corpus, 50)
    expect(model).toEqual(trainBPE(corpus, 50))
    const history = model.timeline
    expect(history).toHaveLength(model.rules.length + 1)
    for (const [i, frame] of history.entries()) {
      expect(frame.step).toBe(i)
      expect(frame.tokenCount).toBe(encode(corpus, model, i).length)
      expect(frame.charsPerToken).toBeCloseTo(Array.from(corpus).length / frame.tokenCount, 12)
      if (i > 0) expect(frame.tokenCount).toBeLessThan(history[i - 1]!.tokenCount)
      const ids = encode(prompt, model, i)
      expect(decode(ids, model.vocab)).toBe(prompt)
      expect(ids.every(id => id < 256 + i)).toBe(true)
    }
  })

  it('stops when no pair remains and reports finite metrics for empty input', () => {
    for (const text of ['', 'x']) {
      const model = trainBPE(text, 60)
      expect(model.rules).toHaveLength(0)
      expect(model.timeline).toHaveLength(1)
      const values = metrics(text, encode(text, model), 0)
      expect(Object.values(values).every(Number.isFinite)).toBe(true)
      expect(values).toMatchObject({ vocabSize: 256, utf8Bytes: text.length, tokenCount: text.length })
    }
  })

  it('reveals incomplete bytes in hex without replacing valid non-ASCII scalars', () => {
    expect(displayBytes([0xe4])).toBe('<0xE4>')
    expect(displayBytes(Array.from(utf8.encode('猫')))).toBe('猫')
    const model = trainBPE('AAAA', 2, false)
    const tree = tokenTree(257, model)
    expect(tree).toMatchObject({ id: 257, bytes: [65,65,65,65], displayText: 'AAAA', depth: 2 })
    expect(tree.left?.id).toBe(256)
    expect(tree.right?.right?.id).toBe(65)
  })

  it('reaches all three challenges using only the multilingual preset and allowed steps', () => {
    const preset = BPE_PRESETS[0]
    const model = trainBPE(preset.corpus, 50)
    const initial = metrics(preset.prompt, encode(preset.prompt, model, 0), 0)
    expect(initial.charCount).toBe([...preset.prompt].length)
    expect(initial.utf8Bytes / initial.charCount).toBeGreaterThan(2.5)
    const ids = encode(preset.prompt, model)
    expect(metrics(preset.prompt, ids, model.rules.length).bytesPerToken).toBeGreaterThanOrEqual(2.2)
    expect(Math.max(...ids.map(id => tokenTree(id, model).depth))).toBeGreaterThanOrEqual(3)
  })
})
