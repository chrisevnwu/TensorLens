import type { RopePlane, VectorPair } from '../../engine/labs/embeddings-rope/engine'

const tau = 2 * Math.PI
const polar = (a: number, r: number) => [50 + r * Math.cos(a), 50 - r * Math.sin(a)] as const

function Arrow({ pair, scale, tone, ghost = false }: { pair: VectorPair; scale: number; tone: string; ghost?: boolean }) {
  const [x, y] = [50 + pair[0] * scale, 50 - pair[1] * scale]
  const angle = Math.atan2(y - 50, x - 50)
  const tip = [0.55, -0.55].map(delta => [x - 5 * Math.cos(angle + delta), y - 5 * Math.sin(angle + delta)])
  return <g className={`rope-${tone}${ghost ? ' rope-ghost' : ''}`}>
    <line x1="50" y1="50" x2={x} y2={y} stroke="currentColor" strokeWidth={ghost ? 1 : 1.7} />
    {ghost ? <circle cx={x} cy={y} r="1.8" fill="currentColor" />
      : <polygon points={[[x,y],...tip].map(point => point.join(',')).join(' ')} fill="currentColor" />}
  </g>
}

export function PolarWheel({ plane }: { plane: RopePlane }) {
  const scale = 38 / Math.max(1e-12, Math.hypot(...plane.q), Math.hypot(...plane.k))
  // The phase arc uses the same +x reference for both positional rotations.
  // The original q and k vectors have independent starting orientations.
  const residual = plane.relativeAngle % tau
  const [startX,startY] = polar(plane.kAngle, 19)
  const [endX,endY] = polar(plane.qAngle, 19)
  return <svg viewBox="0 0 100 100" aria-hidden="true">
    <g className="rope-polar-grid" fill="none">
      <circle cx="50" cy="50" r="38" /><circle cx="50" cy="50" r="19" />
      <path d="M5 50h90 M50 5v90" />
    </g>
    {Math.abs(plane.relativeAngle) >= tau && <circle cx="50" cy="50" r="19" className="rope-full-turn" />}
    {Math.abs(residual) > 1e-10 && <path className="rope-phase-arc" d={`M${startX} ${startY} A19 19 0 ${Math.abs(residual) > Math.PI ? 1 : 0} ${residual > 0 ? 0 : 1} ${endX} ${endY}`} />}
    <circle className="rope-phase-dot" cx={endX} cy={endY} r="1.6" />
    <Arrow pair={plane.q} scale={scale} tone="q" ghost />
    <Arrow pair={plane.k} scale={scale} tone="k" ghost />
    <Arrow pair={plane.rotatedQ} scale={scale} tone="q" />
    <Arrow pair={plane.rotatedK} scale={scale} tone="k" />
    <circle cx="50" cy="50" r="2" fill="var(--text-primary)" />
  </svg>
}
