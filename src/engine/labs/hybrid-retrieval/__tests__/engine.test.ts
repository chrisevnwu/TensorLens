import { expect, it } from 'vitest'
import { retrieve, type RetrievalDocument, type RetrievalQuery } from '../engine'

const docs: RetrievalDocument[] = [
  { id: 'a', tokens: ['x', 'x'], vector: [0, 1, 0] },
  { id: 'b', tokens: ['y', 'z'], vector: [3, 4, 0] },
]
const query: RetrievalQuery = { tokens: ['x'], vector: [1, 0, 0], relevant: ['b'] }

it('uses document frequency and saturated term frequency in BM25, leaving unmatched documents out', () => {
  const result = retrieve(docs, query, { topK: 1, constant: 60 })
  const first = result.rows[0]!
  // N=2, df=1, equal lengths: idf=ln(2), and tf=2 gives 4.4/3.2.
  expect(first.bm25).toBeCloseTo(0.953077373269925, 10)
  expect(first.terms[0]).toMatchObject({ term: 'x', frequency: 2, documentFrequency: 1 })
  expect(first.terms[0]!.idf).toBeCloseTo(Math.LN2)
  expect(result.rankings.bm25.map(row => row.id)).toEqual(['a'])
})

it('compares directions and leaves zero and perpendicular vectors out of the cosine list', () => {
  const result = retrieve(docs, query, { topK: 1, constant: 60 })
  expect(result.rankings.cosine.map(row => row.id)).toEqual(['b'])
  expect(result.rows[1]!.cosine).toBeCloseTo(0.6)
  const zero = retrieve(docs, { ...query, vector: [0, 0, 0] }, { topK: 1, constant: 60 })
  expect(zero.rows.map(row => row.cosine)).toEqual([0, 0])
})

it('fuses one-based source ranks only and measures recall at the output cutoff', () => {
  const fuseQuery: RetrievalQuery = { ...query, vector: [0, 1, 0] }
  const result = retrieve(docs, fuseQuery, { topK: 1, constant: 60 })
  expect(result.rows[0]!.rrf).toBeCloseTo(2 / 61)
  expect(result.rows[1]!.rrf).toBeCloseTo(1 / 62)
  expect(result.rows[1]!.ranks).toMatchObject({ bm25: null, cosine: 2, rrf: 2 })
  expect(result.metrics.rrf.recall).toBe(0)
  const both = retrieve(docs, fuseQuery, { topK: 2, constant: 60 })
  expect(both.metrics.rrf).toEqual({ hits: 1, retrieved: 2, recall: 1, precision: 0.5 })
  expect(both.rows.map(row => row.rrf)).toEqual(result.rows.map(row => row.rrf))
})

it('breaks score ties by ascending ID independently of corpus order and never ranks empty evidence', () => {
  const tied = [{ ...docs[0]!, id: 'z' }, { ...docs[0]!, id: 'a' }]
  const result = retrieve(tied, query, { topK: 2, constant: 0 })
  expect(result.rankings.rrf.map(row => row.id)).toEqual(['a', 'z'])
  expect(result.rankings.rrf.map(row => row.rrf)).toEqual([1, 0.5])
  const empty = retrieve([], { tokens: [], vector: [0, 0, 0], relevant: [] }, { topK: 2, constant: 0 })
  expect(empty.metrics.rrf).toEqual({ hits: 0, retrieved: 0, recall: 0, precision: 0 })
  const misses = retrieve(docs, { ...query, tokens: [], vector: [0, 0, 0] }, { topK: 2, constant: 0 })
  expect(misses.rankings.rrf).toEqual([])
})

it('offers a keyword win, a paraphrase rescue and a fusion winner missed at rank one by both inputs', async () => {
  const { DOCUMENTS, QUERIES } = await import('../library')
  const settings = { constant: 60, topK: 1 }
  const exact = retrieve(DOCUMENTS, QUERIES['error-code'], settings)
  expect(exact.rankings.bm25[0]?.id).toBe('D01')
  expect(exact.metrics.bm25.recall).toBe(1)
  const paraphrase = retrieve(DOCUMENTS, QUERIES.synonym, { ...settings, topK: 2 })
  expect(paraphrase.rankings.bm25).toHaveLength(0)
  expect(paraphrase.rankings.cosine.slice(0, 2).map(row => row.id)).toEqual(['D04', 'D05'])
  expect(paraphrase.metrics.cosine.recall).toBe(1)
  const mixed = retrieve(DOCUMENTS, QUERIES.mixed, settings)
  expect([mixed.rankings.bm25[0]?.id, mixed.rankings.cosine[0]?.id, mixed.rankings.rrf[0]?.id]).toEqual(['D01', 'D03', 'D02'])
  expect([mixed.metrics.bm25.hits, mixed.metrics.cosine.hits, mixed.metrics.rrf.hits]).toEqual([0, 0, 1])
  expect(mixed.rankings.rrf[0]?.rrf).toBeCloseTo(2 / 62)
})

it('changes the cosine winner when the battery coordinate is removed while preserving BM25 evidence', async () => {
  const { DOCUMENTS, QUERIES } = await import('../library')
  const mixed = QUERIES.mixed
  const settings = { topK: 1, constant: 60 }
  const baseline = retrieve(DOCUMENTS, mixed, settings)
  const adjusted = retrieve(DOCUMENTS, { ...mixed, vector: [0.18, 0, 0.12] }, settings)
  expect(baseline.rankings.cosine[0]?.id).toBe('D03')
  expect(adjusted.rankings.cosine[0]?.id).toBe('D01')
  expect(adjusted.rows.map(row => row.bm25)).toEqual(baseline.rows.map(row => row.bm25))
})

it('counts unfilled positions in precision at K even when all relevant notes were retrieved', () => {
  const result = retrieve(docs, query, { topK: 2, constant: 60 })
  expect(result.metrics.cosine).toEqual({ hits: 1, retrieved: 1, recall: 1, precision: 0.5 })
})
