import { choiceField, makeUrlCodec, numberField, type UrlStateCodec } from '../../components/utils/useLabUrlState'
import { DOCUMENTS, QUERIES, QUERY_IDS, type DocumentId, type QueryId } from '../../engine/labs/hybrid-retrieval/library'

interface RetrievalState {
  preset: QueryId
  topK: number
  constant: number
  batteryWeight: number
  document: DocumentId
  step: number
}

export function presetState(preset: QueryId): RetrievalState {
  const selected: Record<QueryId, DocumentId> = { 'error-code': 'D01', synonym: 'D04', mixed: 'D02' }
  return { preset, topK: 2, constant: 60, batteryWeight: QUERIES[preset].vector[1], document: selected[preset], step: 0 }
}

export const initial = presetState('error-code')
const fields = makeUrlCodec<RetrievalState>({
  preset: choiceField(QUERY_IDS), topK: numberField(1, DOCUMENTS.length, 1), constant: numberField(0, 100, 1),
  batteryWeight: numberField(0, 1, 0.05), document: choiceField(DOCUMENTS.map(doc => doc.id)), step: numberField(0, 2, 1),
})

export const codec: UrlStateCodec<RetrievalState> = {
  encode: fields.encode,
  decode(params) {
    const preset = QUERY_IDS.find(value => value === params.get('preset')) ?? initial.preset
    return fields.decode(params, presetState(preset))
  },
}
