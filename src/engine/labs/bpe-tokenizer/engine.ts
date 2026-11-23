const utf8 = new TextEncoder()
const decoder = new TextDecoder('utf-8', { ignoreBOM: true })
const strictDecoder = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true })
const BYTE_COUNT = 256
const MAX_MERGES = 60
const PAIR_BASE = BYTE_COUNT + MAX_MERGES

export interface ByteSpan {
  /** Half-open UTF-8 byte offsets in the original corpus. */
  start: number
  end: number
}

interface Token extends ByteSpan { id: number }

export interface MergeRule {
  step: number
  left: number
  right: number
  newId: number
  count: number
  bytes: number[]
  displayText: string
}

export interface BpeFrame {
  step: number
  tokenCount: number
  charsPerToken: number
  occurrences: ByteSpan[]
}

export interface BpeModel {
  rules: MergeRule[]
  vocab: Map<number, number[]>
  preTokenize: boolean
  timeline: BpeFrame[]
}

export interface BpeTree {
  id: number
  bytes: number[]
  displayText: string
  depth: number
  left?: BpeTree
  right?: BpeTree
}

export function displayBytes(bytes: readonly number[]) {
  try {
    return strictDecoder.decode(Uint8Array.from(bytes))
  } catch {
    return bytes.map(b => `<0x${b.toString(16).toUpperCase().padStart(2, '0')}>`).join(' ')
  }
}

function chunks(text: string, preTokenize: boolean): Token[][] {
  // Preserve leading spaces, punctuation, contractions and every run of whitespace.
  const pattern = /'s|'t|'re|'ve|'m|'ll|'d| ?\p{L}+| ?\p{N}+| ?[^\s\p{L}\p{N}]+|\s+(?!\S)|\s+/gu
  const pieces = preTokenize ? text.match(pattern) ?? [] : [text]
  let offset = 0
  return pieces.map(piece => Array.from(utf8.encode(piece), id => {
    const start = offset++
    return { id, start, end: offset }
  }))
}

function bestPair(words: Token[][]) {
  // Packing by numeric ID preserves lexicographic (left, right) order on ties.
  const counts = new Map<number, number>()
  let key = -1, count = 0
  for (const word of words) {
    for (let i = 1; i < word.length; i++) {
      const candidate = word[i - 1]!.id * PAIR_BASE + word[i]!.id
      const frequency = (counts.get(candidate) ?? 0) + 1
      counts.set(candidate, frequency)
      if (frequency > count || (frequency === count && candidate < key)) {
        key = candidate
        count = frequency
      }
    }
  }
  return count ? { left: Math.floor(key / PAIR_BASE), right: key % PAIR_BASE, count } : undefined
}

function applyRule(words: Token[][], rule: MergeRule, occurrences?: ByteSpan[]) {
  return words.map(word => {
    const merged: Token[] = []
    for (let i = 0; i < word.length; i++) {
      const token = word[i]!, next = word[i + 1]
      if (token.id === rule.left && next?.id === rule.right) {
        const span = { start: token.start, end: next.end }
        merged.push({ id: rule.newId, ...span })
        occurrences?.push(span)
        i++
      } else {
        merged.push(token)
      }
    }
    return merged
  })
}

function stepLimit(step: number, max: number) {
  return Number.isFinite(step) ? Math.max(0, Math.min(max, Math.trunc(step))) : 0
}

export function trainBPE(corpus: string, numMerges = 20, preTokenize = true): BpeModel {
  const vocab = new Map<number, number[]>()
  for (let byte = 0; byte < BYTE_COUNT; byte++) vocab.set(byte, [byte])
  const rules: MergeRule[] = []
  let words = chunks(corpus, preTokenize)
  const chars = Array.from(corpus).length
  let tokenCount = words.reduce((sum, word) => sum + word.length, 0)
  const timeline: BpeFrame[] = [{ step: 0, tokenCount, charsPerToken: tokenCount ? chars / tokenCount : 0, occurrences: [] }]
  const limit = stepLimit(numMerges, MAX_MERGES)
  while (rules.length < limit) {
    const pair = bestPair(words)
    if (!pair) break
    const newId = BYTE_COUNT + rules.length
    const bytes: number[] = [...vocab.get(pair.left)!, ...vocab.get(pair.right)!]
    const rule = { ...pair, step: rules.length + 1, newId, bytes, displayText: displayBytes(bytes) }
    rules.push(rule)
    vocab.set(newId, bytes)
    const occurrences: ByteSpan[] = []
    words = applyRule(words, rule, occurrences)
    tokenCount -= occurrences.length
    timeline.push({ step: rule.step, tokenCount, charsPerToken: chars / tokenCount, occurrences })
  }
  return { rules, vocab, preTokenize, timeline }
}

export function encode(text: string, model: BpeModel, step = model.rules.length): number[] {
  let words = chunks(text, model.preTokenize)
  const limit = stepLimit(step, model.rules.length)
  for (let i = 0; i < limit; i++) words = applyRule(words, model.rules[i]!)
  return words.flatMap(word => word.map(token => token.id))
}

export function decode(ids: readonly number[], vocab: ReadonlyMap<number, number[]>): string {
  const pieces = ids.map(id => {
    const bytes = vocab.get(id)
    if (!bytes) throw new RangeError(`Unknown BPE token ${id}`)
    return bytes
  })
  const buffer = new Uint8Array(pieces.reduce((sum, bytes) => sum + bytes.length, 0))
  let offset = 0
  for (const bytes of pieces) {
    buffer.set(bytes, offset)
    offset += bytes.length
  }
  return decoder.decode(buffer)
}

export function tokenTree(id: number, model: BpeModel): BpeTree {
  const bytes = model.vocab.get(id)
  if (!bytes) throw new RangeError(`Unknown BPE token ${id}`)
  const displayText = displayBytes(bytes)
  const rule = model.rules[id - BYTE_COUNT]
  if (!rule) return { id, bytes, displayText, depth: 0 }
  const left = tokenTree(rule.left, model), right = tokenTree(rule.right, model)
  return { id, bytes, displayText, left, right, depth: 1 + Math.max(left.depth, right.depth) }
}

export function metrics(text: string, ids: readonly number[], step: number) {
  const charCount = Array.from(text).length
  const utf8Bytes = utf8.encode(text).length
  const tokenCount = ids.length
  return {
    charCount, utf8Bytes, tokenCount, vocabSize: BYTE_COUNT + stepLimit(step, MAX_MERGES),
    charsPerToken: tokenCount ? charCount / tokenCount : 0,
    bytesPerToken: tokenCount ? utf8Bytes / tokenCount : 0,
  }
}
