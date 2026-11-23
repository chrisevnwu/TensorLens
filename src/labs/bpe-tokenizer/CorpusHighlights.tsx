import { useMemo } from 'react'
import type { ByteSpan } from '../../engine/labs/bpe-tokenizer/engine'

const utf8 = new TextEncoder()
export const hexByte = (n: number) => n.toString(16).toUpperCase().padStart(2, '0')

interface Segment {
  occurrence: number
  fragment: boolean
  text: string
}

// Split on actual byte boundaries. Keep whole Unicode scalars readable, and
// switch just the split scalar to hex when a pair starts or ends inside it.
function segmentsFor(corpus: string, occurrences: ByteSpan[]) {
  const segments: Segment[] = []
  const append = (occurrence: number, fragment: boolean, text: string) => {
    const last = segments[segments.length - 1]
    if (last && last.occurrence === occurrence && last.fragment === fragment) last.text += text
    else segments.push({ occurrence, fragment, text })
  }
  let offset = 0, index = 0
  for (const character of corpus) {
    const bytes = utf8.encode(character)
    const assigned = Array.from(bytes, () => {
      while (index < occurrences.length && occurrences[index]!.end <= offset) index++
      const group = occurrences[index] && offset >= occurrences[index]!.start ? index : -1
      offset++
      return group
    })
    if (assigned.every(group => group === assigned[0])) append(assigned[0]!, false, character)
    else assigned.forEach((group, i) => append(group, true, `<0x${hexByte(bytes[i]!)}>`))
  }
  return segments
}

export function CorpusHighlights({ corpus, occurrences, fragmentHint }: {
  corpus: string; occurrences: ByteSpan[]; fragmentHint: string
}) {
  const parts = useMemo(() => segmentsFor(corpus, occurrences), [corpus, occurrences])
  return <pre className="bpe-corpus">{parts.map((part, i) => {
    const Tag = part.occurrence >= 0 ? 'mark' : 'span'
    return <Tag key={i} title={part.fragment ? fragmentHint : undefined}>{part.text}</Tag>
  })}</pre>
}
