import { NOTES, type evaluateSequence } from '../../engine/labs/language-model-loss/engine'
import { useI18n } from '../../i18n'
import { lossCopy } from '../../i18n/labs/language-model-loss'

type Evaluation = ReturnType<typeof evaluateSequence>
export function decimal(value: number | null, digits = 3) {
  return value === null ? '—' : value.toFixed(digits)
}
export function percent(value: number) {
  return (100 * value).toFixed(value > 0 && value < .01 ? 3 : 1) + '%'
}

export function LossStage({ run, reference, step, onSelect }: {
  run: Evaluation; reference: Evaluation; step: number; onSelect: (step: number) => void
}) {
  const { locale } = useI18n()
  const t = lossCopy[locale]
  const row = run.rows[step]!
  const ceiling = Math.max(1, Math.ceil(Math.max(...run.rows.map(r => r.loss), ...reference.rows.map(r => r.loss))))
  return <div className="loss-stage">
    <section>
      <div className="loss-section-head"><h2>{t.perPosition}</h2><span>{t.axis}</span></div>
      <p className="loss-sequence">{t.sequenceLabel} <b>{[NOTES[run.rows[0]!.previous], ...run.rows.map(r => NOTES[r.target])].join(' · ')}</b></p>
      <div className="loss-key"><span>{t.model}</span><span>{t.reference}</span></div>
      <div className="loss-plot">
        <div className="loss-axis" aria-hidden="true"><span>{ceiling}</span><span>0</span></div>
        <div className="loss-columns" role="group" aria-label={t.steps}>
          {run.rows.map((r, i) => <button type="button" key={i} aria-pressed={step === i} data-included={r.included}
            aria-label={t.position + ' ' + (i + 1) + ' · ' + NOTES[r.target] + ' · ' + (r.included ? t.scored : t.excluded)}
            onClick={() => onSelect(i)}>
            <span className="loss-bars" aria-hidden="true">
              <i style={{ height: 100 * r.loss / ceiling + '%' }} />
              <i style={{ height: 100 * reference.rows[i]!.loss / ceiling + '%' }} />
            </span>
            <span className="loss-note"><small>{i + 1}</small> {NOTES[r.target]}</span>
          </button>)}
        </div>
      </div>
    </section>
    <section className="loss-distribution">
      <div className="loss-section-head"><h2>{t.distribution}</h2><span>{t.following} <b>{NOTES[row.previous]}</b></span></div>
      <div className="loss-prob-rows">
        {NOTES.map((note, i) => <div key={note} data-observed={i === row.target}>
          <b>{note}</b>
          <span className="loss-track" aria-hidden="true">
            <i style={{ width: 100 * row.probabilities[i]! + '%' }}/>
            <i style={{ left: 100 * reference.rows[step]!.probabilities[i]! + '%' }}/>
          </span>
          <output>{percent(row.probabilities[i]!)}</output>
        </div>)}
      </div>
      <div className="loss-dist-key">
        <span>{t.observed} <b>{NOTES[row.target]}</b></span>
        <span>{t.predicted} <b>{NOTES[row.predicted]}</b></span>
        <span>{t.referenceKey}</span>
      </div>
    </section>
    <section>
      <h2>{t.comparison}</h2>
      <table className="loss-comparison">
        <thead><tr><td></td><th scope="col">{t.accuracy}</th><th scope="col">{t.meanLoss}</th><th scope="col">{t.perplexity}</th></tr></thead>
        <tbody>{[run, reference].map((item, i) =>
          <tr key={i} data-model={i === 0 ? 'current' : 'reference'}><th scope="row">{i === 0 ? t.model : t.reference}</th>
            <td>{item.count ? item.correct + '/' + item.count : '—'}</td>
            <td>{decimal(item.meanLoss)}</td><td>{decimal(item.perplexity)}</td>
          </tr>)}</tbody>
      </table>
      {!run.count && <p role="status">{t.noTargets}</p>}
    </section>
  </div>
}
