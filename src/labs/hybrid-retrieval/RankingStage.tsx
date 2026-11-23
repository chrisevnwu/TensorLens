import { METHODS, type Method, type ScoredDocument, type retrieve } from '../../engine/labs/hybrid-retrieval/engine'
import { QUERIES, type DocumentId, type QueryId } from '../../engine/labs/hybrid-retrieval/library'
import type { RetrievalCopy } from '../../i18n/labs/hybrid-retrieval'

export type RetrievalResult = ReturnType<typeof retrieve<DocumentId>>

interface StageProps {
  t: RetrievalCopy
  queryId: QueryId
  result: RetrievalResult
  method: Method
  selected: ScoredDocument<DocumentId>
  topK: number
  onStage: (method: Method) => void
  onSelect: (id: DocumentId, method: Method) => void
}

export function RankingStage({ t, queryId, result, method, selected, topK, onStage, onSelect }: StageProps) {
  const lists = result.rankings
  const rowHeight = 36
  const height = Math.max(1, ...METHODS.map(key => lists[key].length)) * rowHeight
  const paths = result.rows.flatMap(row => (['bm25', 'cosine'] as const).flatMap((origin, i) => {
    const left = row.ranks[origin], right = row.ranks[METHODS[i + 1]!]
    if (left === null || right === null) return []
    const x = 50 + 100 * i
    const y1 = (left - 0.5) * rowHeight, y2 = (right - 0.5) * rowHeight
    return [{ key: row.id + origin, id: row.id, d: `M${x} ${y1} C${x + 52} ${y1}, ${x + 48} ${y2}, ${x + 100} ${y2}` }]
  })).sort((a, b) => Number(a.id === selected.id) - Number(b.id === selected.id))

  return <section className="retrieval-stage">
    <header className="retrieval-query">
      <h2>{t.query}</h2>
      <p>{t.queries[queryId]}</p>
      <div className="retrieval-terms"><span>{t.queryTerms}</span>
        {QUERIES[queryId].tokens.map(token => <code key={token}>{token}</code>)}
      </div>
    </header>
    <figure className="retrieval-board">
      <figcaption>{t.diagram}</figcaption>
      <p>{t.instruction}</p>
      <div className="retrieval-methods">
        {METHODS.map(key => <button type="button" key={key} aria-pressed={key === method} onClick={() => onStage(key)}>{t.method[key]}</button>)}
      </div>
      <div className="retrieval-ranks" style={{ height }}>
        <svg aria-hidden="true" viewBox={'0 0 300 ' + height} preserveAspectRatio="none">
          {paths.map(path => <path key={path.key} d={path.d} fill="none" stroke={path.id === selected.id ? 'var(--accent-primary)' : 'var(--border-strong)'}
            strokeWidth={path.id === selected.id ? 2.5 : 1.25} vectorEffect="non-scaling-stroke" />)}
        </svg>
        {METHODS.map(key => <div key={key} className="retrieval-lane" data-ranking={key}>
          {lists[key].length === 0 && <div className="retrieval-absent">{t.absent}</div>}
          {lists[key].map((row, i) => <div key={row.id} className="retrieval-rank">
            <button type="button" data-doc={row.id} data-kept={i < topK} aria-pressed={selected.id === row.id && method === key}
              title={t.docs[row.id] + ' · ' + t.score + ' ' + row[key].toFixed(4)}
              aria-label={t.method[key] + ' · ' + t.ranks + ' ' + (i + 1) + ' · ' + row.id + ' · ' + t.docs[row.id]}
              onClick={() => onSelect(row.id, key)}><small>{i + 1}</small>{row.id}</button>
          </div>)}
        </div>)}
      </div>
      <div className="retrieval-cutoff"><i aria-hidden="true"/>{t.top} · K = {topK}</div>
    </figure>
    <div className="retrieval-readout" data-selected-document={selected.id}>
      <div className="retrieval-readout-title"><code>{selected.id}</code><h3>{t.docs[selected.id]}</h3>
        <span>{selected.relevant ? t.judgedRelevant : t.judgedOther}</span></div>
      <div className="retrieval-terms"><span>{t.terms}</span>{selected.tokens.map((token, i) =>
        <code key={i} data-match={selected.terms.some(term => term.term === token)}>{token}</code>)}</div>
      <dl>{METHODS.map(key => <div key={key} data-active={key === method}>
        <dt>{t.method[key]}</dt><dd data-score={key}>{selected[key].toFixed(4)}</dd>
      </div>)}</dl>
    </div>
  </section>
}
