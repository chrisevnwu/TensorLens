import type { RetrievalDocument, RetrievalQuery } from './engine'

// Fixed index terms and hand-coded topical weights for a six-card bicycle help desk.
// The axes are fault codes, battery and docking. Corpus and relevance are shared by both locales.
export const DOCUMENTS = [
  { id: 'D01', tokens: ['e17', 'reset', 'e17', 'display', 'e17'], vector: [1, 0, 0] },
  { id: 'D02', tokens: ['e17', 'battery', 'contacts', 'clean', 'dock'], vector: [0.58, 0.8, 0.25] },
  { id: 'D03', tokens: ['battery', 'battery', 'charger', 'current', 'voltage'], vector: [0, 1, 0] },
  { id: 'D04', tokens: ['dock', 'latch', 'release', 'lever'], vector: [0, 0, 1] },
  { id: 'D05', tokens: ['station', 'return', 'rack', 'wheel', 'release'], vector: [0, 0.15, 1] },
  { id: 'D06', tokens: ['display', 'blink', 'menu', 'diagnostic', 'reset'], vector: [0.85, 0.05, 0] },
] as const satisfies readonly RetrievalDocument[]

export const QUERIES = {
  'error-code': { tokens: ['e17', 'reset'], vector: [1, 0, 0], relevant: ['D01'] },
  synonym: { tokens: ['jammed', 'fastener'], vector: [0, 0, 1], relevant: ['D04', 'D05'] },
  mixed: { tokens: ['e17', 'no', 'power'], vector: [0.18, 1, 0.12], relevant: ['D02'] },
} as const satisfies Record<string, RetrievalQuery>

export type QueryId = keyof typeof QUERIES
export type DocumentId = typeof DOCUMENTS[number]['id']
export const QUERY_IDS = Object.keys(QUERIES) as QueryId[]
