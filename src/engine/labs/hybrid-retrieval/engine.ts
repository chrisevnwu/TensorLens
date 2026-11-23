export type TopicVector = readonly [number, number, number]

export interface RetrievalDocument<Id extends string = string> {
  id: Id
  tokens: readonly string[]
  vector: TopicVector
}

export interface RetrievalQuery {
  tokens: readonly string[]
  vector: TopicVector
  relevant: readonly string[]
}

export interface RetrievalSettings {
  topK: number
  constant: number
}

export const METHODS = ['bm25', 'cosine', 'rrf'] as const
export type Method = typeof METHODS[number]

interface TermEvidence {
  term: string
  frequency: number
  documentFrequency: number
  idf: number
  contribution: number
}
export interface ScoredDocument<Id extends string = string> extends RetrievalDocument<Id> {
  terms: TermEvidence[]
  bm25: number
  cosine: number
  rrf: number
  ranks: Record<Method, number | null>
  relevant: boolean
}
export interface RetrievalMetrics {
  hits: number
  retrieved: number
  recall: number
  precision: number
}

const k1 = 1.2
const b = 0.75

function cosine(left: TopicVector, right: TopicVector) {
  const norm = Math.hypot(...left) * Math.hypot(...right)
  return norm === 0 ? 0 : (left[0] * right[0] + left[1] * right[1] + left[2] * right[2]) / norm
}

export function retrieve<Id extends string>(documents: readonly RetrievalDocument<Id>[], query: RetrievalQuery, settings: RetrievalSettings) {
  const meanLength = documents.reduce((total, doc) => total + doc.tokens.length, 0) / Math.max(1, documents.length)
  const statistics = [...new Set(query.tokens)].map(term => {
    const documentFrequency = documents.filter(doc => doc.tokens.includes(term)).length
    const idf = Math.log1p((documents.length - documentFrequency + 0.5) / (documentFrequency + 0.5))
    return { term, documentFrequency, idf }
  })
  const relevant = new Set(query.relevant)
  const rows: ScoredDocument<Id>[] = documents.map(doc => {
    const terms = statistics.map(stat => {
      const frequency = doc.tokens.filter(token => token === stat.term).length
      const lengthFactor = 1 - b + b * doc.tokens.length / Math.max(1e-12, meanLength)
      const contribution = stat.idf * frequency * (k1 + 1) / (frequency + k1 * lengthFactor)
      return { ...stat, frequency, contribution }
    })
    return {
      ...doc, terms, cosine: cosine(doc.vector, query.vector), bm25: terms.reduce((sum, term) => sum + term.contribution, 0),
      rrf: 0, ranks: { bm25: null, cosine: null, rrf: null }, relevant: relevant.has(doc.id),
    }
  })
  function rank(method: Method) {
    const ranked = rows.filter(row => row[method] > 0).sort((left, right) =>
      right[method] - left[method] || (left.id < right.id ? -1 : left.id > right.id ? 1 : 0))
    ranked.forEach((row, index) => { row.ranks[method] = index + 1 })
    return ranked
  }
  const bm25 = rank('bm25')
  const cosineRanking = rank('cosine')
  const constant = Math.max(0, settings.constant)
  for (const list of [bm25, cosineRanking]) {
    list.forEach((row, i) => { row.rrf += 1 / (constant + i + 1) })
  }
  const rankings = { bm25, cosine: cosineRanking, rrf: rank('rrf') }
  function evaluate(ranked: ScoredDocument<Id>[]): RetrievalMetrics {
    const cutoff = Math.max(0, Math.floor(settings.topK))
    const first = ranked.slice(0, cutoff)
    const hits = first.filter(row => row.relevant).length
    return { hits, retrieved: first.length, recall: relevant.size ? hits / relevant.size : 0, precision: cutoff ? hits / cutoff : 0 }
  }
  const metrics = { bm25: evaluate(bm25), cosine: evaluate(cosineRanking), rrf: evaluate(rankings.rrf) }
  return { rows, rankings, metrics, meanLength, relevantCount: relevant.size }
}
