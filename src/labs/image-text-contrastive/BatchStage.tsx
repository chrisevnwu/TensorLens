import { SegmentedControl } from '../../components/controls'
import type { Experiment, SampleId } from '../../engine/labs/image-text-contrastive/engine'
import { useI18n } from '../../i18n'
import { contrastiveCopy } from '../../i18n/labs/image-text-contrastive'
import { views, type State } from './config'
import './contrastive.css'

function Drawing({ id }: { id: SampleId }) {
  return <svg className="contrastive-drawing" viewBox="0 0 68 34" aria-hidden="true">
    {id === 'triangle' && <path d="M34 3 50 30H18Z" />}
    {id === 'circle' && <circle cx="34" cy="17" r="13" />}
    {id === 'duo' && <><circle cx="19" cy="17" r="12" /><circle cx="49" cy="17" r="12" /></>}
  </svg>
}

interface Props {
  state: State
  batch: Experiment
  onSelect: (row: number, column: number) => void
  onView: (view: State['view']) => void
}

export function BatchStage({ state, batch, onSelect, onView }: Props) {
  const { locale } = useI18n()
  const t = contrastiveCopy[locale]
  const { step, column, broad, view } = state
  const captionName = (id: SampleId) => broad && id === 'duo' ? t.generic : t.samples[id]
  const image = batch.images[step]!, caption = batch.captions[column]!
  return <div className="contrastive-stage">
    <SegmentedControl label={t.view} value={view} onChange={onView} options={views.map(value => ({ value, label: t.views[value] }))} />
    <table className="contrastive-grid" aria-label={t.matrix}>
      <thead><tr><td></td>{batch.captions.map((id, j) =>
        <th key={id} scope="col"><small>{t.caption} {j + 1}</small>{captionName(id)}</th>)}</tr></thead>
      <tbody>{batch.images.map((id, i) => <tr key={id}>
        <th scope="row"><Drawing id={id} /><small>{t.image} {i + 1}</small><span>{t.samples[id]}</span></th>
        {batch.captions.map((text, j) => {
          const cosine = batch.cosines[i]![j]!
          const value = view === 'cosine' ? cosine : view === 'image' ? batch.byImage[i]![j]! : batch.byCaption[j]![i]!
          const display = view === 'cosine' ? value.toFixed(2) : (value * 100).toFixed(1) + '%'
          const label = t.cell.replace('{i}', String(i + 1)).replace('{j}', String(j + 1))
            .replace('{image}', t.samples[id]).replace('{caption}', captionName(text)).replace('{kind}', i === j ? t.target : t.comparison)
          return <td key={text}><button type="button" data-cell={i + '-' + j}
            aria-label={label + ' ' + display} aria-pressed={step === i && column === j}
            onClick={() => onSelect(i, j)} style={{ backgroundColor: 'color-mix(in srgb, var(--accent-primary) ' + (4 + 22 * value) + '%, var(--bg-surface))' }}>
            {i === j && <span className="contrastive-target" aria-hidden="true">◇</span>}{display}
          </button></td>
        })}
      </tr>)}</tbody>
    </table>
    <p className="contrastive-help">{t.matrixHelp}</p>
    <div className="contrastive-inspect">
      <div className="contrastive-vector"><span>{t.image} {step + 1} · {t.samples[image]}</span><code>[{batch.imageFeatures[step]!.join(', ')}]</code></div>
      <div className="contrastive-vector"><span>{t.caption} {column + 1} · {captionName(caption)}</span><code>[{batch.captionFeatures[column]!.join(', ')}]</code></div>
      <p>{t.features} · {t.featureOrder}</p>
      {([[t.imageToText, batch.byImage[step]![column]!], [t.textToImage, batch.byCaption[column]![step]!]] as const).map(([label, probability]) =>
        <div key={label} className="contrastive-prob">
          <span>{label}</span><strong>{(probability * 100).toFixed(1)}%</strong>
          <div aria-hidden="true"><i style={{ width: probability * 100 + '%' }} /></div>
        </div>)}
    </div>
  </div>
}
