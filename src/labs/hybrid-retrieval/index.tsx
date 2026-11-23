import { useMemo } from 'react'
import { SelectControl, SliderControl } from '../../components/controls'
import { ExperimentShell } from '../../components/layout/ExperimentShell'
import { useLabUrlState } from '../../components/utils/useLabUrlState'
import { FormulaBar } from '../../components/viz/FormulaBar'
import { METHODS, retrieve, type RetrievalQuery } from '../../engine/labs/hybrid-retrieval/engine'
import { DOCUMENTS, QUERIES, QUERY_IDS } from '../../engine/labs/hybrid-retrieval/library'
import { useI18n } from '../../i18n'
import { retrievalCopy } from '../../i18n/labs/hybrid-retrieval'
import { codec, initial, presetState } from './config'
import { RankingStage } from './RankingStage'
import './retrieval.css'

const formulas = {
  bm25: String.raw`s_d=\sum_{t\in q}\mathrm{IDF}(t)\frac{f_t(k_1+1)}{f_t+k_1(1-b+b|d|/\bar{L})}`,
  cosine: String.raw`s_d=\frac{q\cdot d}{\lVert q\rVert\,\lVert d\rVert}`,
  rrf: String.raw`s_d=\sum_{j:\,d\in L_j}\frac{1}{c+r_j(d)}`,
}

export default function RetrievalLab() {
  const t = retrievalCopy[useI18n().locale]
  const { state, setState, getShareUrl } = useLabUrlState(initial, codec)
  const { preset, topK, constant, batteryWeight, step } = state
  const query = useMemo<RetrievalQuery>(() => {
    const source = QUERIES[preset]
    return { ...source, vector: [source.vector[0], batteryWeight, source.vector[2]] }
  }, [preset, batteryWeight])
  const result = useMemo(() => retrieve(DOCUMENTS, query, { topK, constant }), [query, topK, constant])
  const selected = result.rows.find(row => row.id === state.document)!
  const method = METHODS[step]!
  const metrics = result.metrics[method]
  const lexical = selected.ranks.bm25
  const semantic = selected.ranks.cosine
  function update(changes: Partial<typeof state>) { setState(old => ({ ...old, ...changes })) }

  return <ExperimentShell labId="hybrid-retrieval" step={step} maxStep={2} onStepChange={step => update({ step })} intervalMs={1600}
    getShareUrl={getShareUrl} onReset={() => setState(presetState(preset))}
    presets={QUERY_IDS.map(id => ({ id, label: t.presets[id], active: preset === id, onSelect: () => setState(presetState(id)) }))}
    controls={<>
      <SliderControl label={t.cutoff} min={1} max={DOCUMENTS.length} value={topK} onChange={topK => update({ topK })}/>
      <SliderControl label={t.batteryWeight} min={0} max={1} step={0.05} value={batteryWeight} onChange={batteryWeight => update({ batteryWeight })}/>
      <SliderControl label={t.constant} min={0} max={100} value={constant} onChange={constant => update({ constant })}/>
      <SelectControl label={t.inspect} value={state.document} options={DOCUMENTS.map(doc => ({ value: doc.id, label: doc.id + ' · ' + t.docs[doc.id] }))}
        onChange={document => update({ document })}/>
    </>}
    formula={<FormulaBar tex={formulas[method]} />}
    stage={<RankingStage t={t} queryId={preset} result={result} method={method} selected={selected} topK={topK}
      onStage={stage => update({ step: METHODS.indexOf(stage) })}
      onSelect={(document, stage) => update({ document, step: METHODS.indexOf(stage) })}/>}
    metrics={[
      { label: t.recall, value: (metrics.recall * 100).toFixed(0) + '%', hint: t.method[method] + ' · K = ' + topK, tone: 'accent' },
      { label: t.precision, value: (metrics.precision * 100).toFixed(0) + '%', hint: t.precisionHint },
      { label: t.recalled, value: metrics.hits + ' / ' + result.relevantCount }, { label: t.available, value: String(metrics.retrieved) },
    ]}
    inspector={<section className="retrieval-inspector">
      <h3>{selected.id} · {t.docs[selected.id]}</h3>
      <h4>{t.matches}</h4>
      <table><thead><tr>{[t.term, t.frequency, t.corpusFrequency, 'IDF', t.contribution].map(label => <th key={label}>{label}</th>)}</tr></thead>
        <tbody>{selected.terms.map(term => <tr key={term.term}><th scope="row">{term.term}</th><td>{term.frequency}</td><td>{term.documentFrequency}</td>
          <td>{term.idf.toFixed(2)}</td><td>{term.contribution.toFixed(3)}</td></tr>)}</tbody></table>
      <h4>{t.vectors}</h4>
      <table><thead><tr><th scope="col">{t.vectors}</th><th scope="col">{t.queryVector}</th><th scope="col">{selected.id}</th></tr></thead>
        <tbody>{[t.axisCode,t.axisBattery,t.axisDock].map((axis, i) =>
          <tr key={axis}><th scope="row">{axis}</th><td>{query.vector[i]}</td><td>{selected.vector[i]}</td></tr>)}</tbody></table>
      <h4>{t.votes}</h4>
      <dl>{([['bm25', lexical], ['cosine', semantic]] as const).map(([key, rank]) => <div key={key}>
        <dt>{t.method[key]}</dt><dd>{rank === null ? '0' : '1 / (' + constant + ' + ' + rank + ')'}</dd></div>)}
        <div><dt>{t.sum}</dt><dd>{selected.rrf.toFixed(5)}</dd></div></dl>
      <p>{t.judged} · {query.relevant.join(', ')}</p>
    </section>}
    explainer={<><p>{t.guides[method]}</p><p>{t.model}</p><p>{t.policy}</p></>}
    challenges={[
      { id: 'exact', ...t.missions.exact, completed: preset === 'error-code' && method === 'bm25' && topK === 1 && selected.id === 'D01' && lexical === 1 && metrics.recall === 1 },
      { id: 'synonym', ...t.missions.synonym, completed: preset === 'synonym' && method === 'cosine' && topK === 2 && result.metrics.bm25.hits === 0 && metrics.recall === 1 },
      { id: 'consensus', ...t.missions.consensus, completed: preset === 'mixed' && method === 'rrf' && topK === 1 && selected.id === 'D02' && lexical === 2 && semantic === 2 && selected.ranks.rrf === 1 },
    ]}/>
}
