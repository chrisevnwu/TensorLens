import { memo } from 'react'
import { decode, displayBytes, type BpeModel, type BpeTree } from '../../engine/labs/bpe-tokenizer/engine'
import { useI18n } from '../../i18n'
import { bpeVisuals } from '../../i18n/labs/bpe-visuals'
import { CompressionChart } from './CompressionChart'
import { CorpusHighlights, hexByte } from './CorpusHighlights'
import './bpe.css'

interface StageProps {
  corpus: string
  prompt: string
  model: BpeModel
  ids: readonly number[]
  step: number
  showByteHex: boolean
  selectedIndex: number | null
  onSelect: (index: number) => void
  onPreview?: (index: number | null) => void
}

const visibleSpaces = (s: string) => s.replaceAll(' ', '␣').replaceAll('\n', '↵').replaceAll('\t', '⇥').replaceAll('\r', '␍')
const Timeline = memo(CompressionChart)

export function BpeStage({ corpus, prompt, model, ids, step, showByteHex, selectedIndex, onSelect, onPreview }: StageProps) {
  const { locale } = useI18n()
  const t = bpeVisuals[locale]
  const frame = model.timeline[step] ?? model.timeline[0]!
  const rule = model.rules[frame.step-1]
  return <div className="bpe-stage">
    <section className="bpe-section">
      <h2>{t.stream}<span>{ids.length}</span></h2>
      <div className="bpe-tokens" onPointerLeave={() => onPreview?.(null)}>
        {ids.map((id, index) => {
          const bytes = model.vocab.get(id)!
          const text = visibleSpaces(displayBytes(bytes))
          return <button type="button" className="bpe-chip" key={index} data-tone={id % 5} data-token-id={id} data-token-index={index}
            aria-label={`${t.token} ${index + 1}, ID ${id}, ${text}`} aria-pressed={selectedIndex === index}
            onPointerEnter={() => onPreview?.(index)} onFocus={() => onPreview?.(index)}
            onBlur={() => onPreview?.(null)} onClick={() => onSelect(index)}>
            <span>{text}</span>{showByteHex && <small>{bytes.map(hexByte).join(' ')}</small>}
          </button>
        })}
      </div>
      {!prompt && <p>{t.promptEmpty}</p>}
      {ids.length > 0 && <details className="bpe-decoded"><summary>{t.decoded}</summary><pre>{decode(ids, model.vocab)}</pre></details>}
    </section>
    <Timeline frames={model.timeline} step={frame.step} />
    <section className="bpe-section"><h2>{t.highlights}</h2>
      {rule ? <p className="bpe-rule"><code>{rule.left} + {rule.right} → {rule.newId}</code>
        <span>{t.occurrences} <b>{frame.occurrences.length}</b></span></p> : <p>{t.initial}</p>}
      {corpus ? <CorpusHighlights corpus={corpus} occurrences={frame.occurrences} fragmentHint={t.rawFragment} /> : <p>{t.emptyCorpus}</p>}
    </section>
  </div>
}

function TreeNode({ node, raw }: { node: BpeTree; raw: string }) {
  const leaf = !node.left || !node.right
  const content = <><span>{visibleSpaces(node.displayText)}</span> <small>#{node.id}</small></>
  if (leaf) return <li><div className="bpe-tree-leaf" title={raw}>{content} <code>0x{hexByte(node.bytes[0]!)}</code></div></li>
  return <li><details open>
    <summary>{content}</summary>
    <ul><TreeNode node={node.left!} raw={raw} /><TreeNode node={node.right!} raw={raw} /></ul>
  </details></li>
}

export function BpeInspector({ tree }: { tree?: BpeTree | null }) {
  const { locale } = useI18n()
  const t = bpeVisuals[locale]
  return <div className="bpe-inspector"><h3>{t.tree}</h3>
    {tree ? <>
      <p>{t.depth} <b>{tree.depth}</b> · {t.bytes} <b>{tree.bytes.length}</b></p>
      <ul className="bpe-tree"><TreeNode node={tree} raw={t.raw} /></ul>
    </> : <p>{t.noSelection}</p>}
  </div>
}
