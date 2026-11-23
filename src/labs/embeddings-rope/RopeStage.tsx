import type { RopePlane, RopeResult, ScalingMode, VectorPair } from '../../engine/labs/embeddings-rope/engine'
import { useI18n } from '../../i18n'
import { ropeVisuals } from '../../i18n/labs/rope-visuals'
import { PolarWheel } from './PolarWheel'
import { DecayCurve } from './DecayCurve'
import './rope.css'

interface Props {
  result: RopeResult
  scalingMode: ScalingMode
  compareSinusoidal: boolean
  plane: number
  onSelectPlane: (index: number) => void
  onDistanceChange: (distance: number) => void
}

export function RopeStage({result, scalingMode, compareSinusoidal, plane, onSelectPlane, onDistanceChange}: Props) {
  const { locale } = useI18n()
  const t = ropeVisuals[locale]
  return <div className="rope-stage">
    <section><h2>{t.wheels}</h2>
      <div className="rope-legend">
        <span><i className="rope-q" />Rₘq</span><span><i className="rope-k" />Rₙk</span>
        <span><i className="rope-ghost" />{t.original}</span><span><i className="rope-phase" />{t.angle}</span>
      </div>
      <div className="rope-wheels">
        {result.planes.map(p => <button type="button" data-plane={p.index} key={p.index}
          aria-pressed={plane === p.index} aria-label={`${t.plane} ${p.index}`} onClick={() => onSelectPlane(p.index)}>
          <span>{t.plane} {p.index}</span><PolarWheel plane={p} />
          <small>{p.index === 0 ? t.fastest : p.index === result.planes.length-1 ? t.slowest : `θ = ${p.frequency.toPrecision(2)}`}</small>
        </button>)}
      </div>
    </section>
    <DecayCurve points={result.curve} distance={Math.abs(result.relativeOffset)} mode={scalingMode} compare={compareSinusoidal} onChange={onDistanceChange} />
  </div>
}

function tuple(pair: VectorPair) { return `(${pair[0].toFixed(3)}, ${pair[1].toFixed(3)})` }

export function RopeInspector({ plane }: { plane: RopePlane }) {
  const { locale } = useI18n()
  const t = ropeVisuals[locale]
  return <section className="rope-inspector"><h3>{t.plane} {plane.index}</h3>
    <dl>{[
      [t.frequency, `${plane.frequency.toPrecision(5)} rad`],
      [t.angle, `${plane.relativeAngle.toFixed(4)} rad`],
      ['φq', `${plane.qAngle.toFixed(4)} rad`],
      ['φk', `${plane.kAngle.toFixed(4)} rad`],
    ].map(([label,value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
    <table><thead><tr><th>{t.vector}</th><th>{t.input}</th><th>{t.output}</th></tr></thead>
      <tbody>{[
        ['q', tuple(plane.q), tuple(plane.rotatedQ)], ['k', tuple(plane.k), tuple(plane.rotatedK)],
      ].map(([name,original,rotated]) => <tr key={name}><th>{name}</th><td>{original}</td><td>{rotated}</td></tr>)}</tbody>
    </table>
  </section>
}
