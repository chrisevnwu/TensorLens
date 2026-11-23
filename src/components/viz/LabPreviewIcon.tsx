import type { ReactNode } from 'react'

// Schematic icons describe each lab's mechanism. The interactive workbenches
// render the actual parameter-dependent values.
function Nodes({ points, radius = 3 }: { points: readonly (readonly [number, number])[]; radius?: number }) {
  return points.map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r={radius} className="glyph-node" />)
}

function Tree({ beam = false }: { beam?: boolean }) {
  return <>
    <path className="glyph-faint" d="M58 22 29 45 12 66 M29 45 42 66 M58 22 87 45 71 66 M87 45 104 66" />
    <path d={beam ? 'M58 22 87 45 71 66' : 'M12 66 29 45 58 22 87 45 104 66 M42 66 29 45 M71 66 87 45'} />
    <Nodes points={[[58,22],[29,45],[87,45],[12,66],[42,66],[71,66],[104,66]]} />
  </>
}

function Rotation() {
  return <>
    <g className="glyph-faint"><ellipse cx="58" cy="43" rx="37" ry="25" /><path d="M9 43h98 M58 9v67" /></g>
    <path d="M58 43 86 26 M58 43 34 29 M76 43a18 13 0 0 0-5-9" />
    <path className="glyph-secondary" d="M58 43 72 63 M58 43 31 56" />
    <Nodes points={[[58,43],[86,26],[34,29],[72,63],[31,56]]} />
  </>
}

function Attention() {
  return <>
    {[0,1,2,3,4,5].map(i => <g key={i}>
      <path className={i % 2 ? 'glyph-secondary' : undefined} d={`M${12+i*16} 61 Q${59+i*4} ${-8+i*6} 107 61`} />
      <rect className="glyph-node" x={7+i*16} y="60" width="10" height="7" rx="2" />
    </g>)}
    <rect className="glyph-node" x="102" y="60" width="10" height="7" rx="2" />
  </>
}

function Residual() {
  return <>
    <path className="glyph-faint" d="M8 48h101" />
    <path d="M14 47V28q0-5 5-5h66q5 0 5 5v12 M8 49h11m18 0h11m18 0h17m14 0h15" />
    <rect x="19" y="39" width="18" height="20" rx="3" /><rect x="48" y="39" width="18" height="20" rx="3" />
    <circle cx="90" cy="49" r="9" /><path d="M86 49h8m-4-4v8" />
  </>
}

function Cache() {
  return <>
    {[0,1,2].map(i => <g key={i} transform={`translate(${i*6},${-i*6})`}>
      <rect className="glyph-node" x="20" y="35" width="45" height="24" rx="3" />
      <path d="M26 42h17m-17 6h29" />
    </g>)}
    <path className="glyph-secondary" d="M76 37h13V25h17m-5-5 5 5-5 5 M76 37h13v18h17m-5-5 5 5-5 5" />
  </>
}

function Tiling() {
  return <>
    {[0,1,2,3].flatMap(r => [0,1,2,3].map(c => <rect key={`${r}-${c}`} className={r < 2 && c < 2 ? 'glyph-node' : 'glyph-faint'} x={13+c*12} y={20+r*12} width="10" height="10" rx="1" />))}
    <path d="M38 18V12h51v10m-5-5 5 5 5-5" strokeDasharray="3 3" />
    <rect x="77" y="26" width="25" height="28" rx="3" /><path d="M82 33h15m-15 6h15m-15 6h10" />
  </>
}

function Routing() {
  return <>
    {[0,1,2,3].map(i => <g key={i}>
      <path className={i % 2 ? 'glyph-secondary' : undefined} d={`M24 ${20+i*15} C46 ${20+i*15} 44 41 58 41 S78 ${20+i*15} 93 ${20+i*15}`} />
      <rect className="glyph-node" x="12" y={16+i*15} width="12" height="8" rx="2" />
      <circle className="glyph-node" cx="98" cy={20+i*15} r="5" />
    </g>)}
    <path className="glyph-node" d="m58 32 9 9-9 9-9-9z" />
  </>
}

function Quantization() {
  return <>
    <path className="glyph-faint" d="M9 65h98 M16 69V15" />
    <path className="glyph-secondary" d="M16 57q9-50 25-15t26-5 33-12" />
    <path d="M16 56h8V40h9v-8h10v8h9v9h10V39h11V27h10v-7h12v5h7" />
  </>
}

function LowRank() {
  return <>
    <rect x="10" y="24" width="18" height="38" rx="2" /><path className="glyph-faint" d="M16 24v38m6-38v38m-12-26h18m-18 13h18"/>
    <path d="m34 38 7 7m0-7-7 7" /><rect x="48" y="33" width="26" height="18" rx="2" />
    <path className="glyph-faint" d="M48 39h26m-26 6h26m-13-12v18"/>
    <path d="M78 39h7m-7 6h7" /><rect className="glyph-secondary" x="90" y="27" width="20" height="30" rx="2" />
  </>
}

function Contours() {
  return <>
    <g transform="rotate(-22 58 42)" className="glyph-faint">
      {[1,2,3,4].map(i => <ellipse key={i} cx="58" cy="42" rx={i*12} ry={i*6.5} />)}
    </g>
    <path d="m18 26 16 31 6-28 10 20 8-9" /><path className="glyph-secondary" d="M18 26q14 29 40 14" />
    <Nodes points={[[18,26],[34,57],[40,29],[50,49],[58,40]]} radius={2.5} />
  </>
}

function Flow() {
  return <>
    {[0,1,2,3,4,5].map(i => <g key={i}>
      <path className={i < 3 ? 'glyph-secondary' : undefined}
        d={`M${8+i*2} ${14+i*10} C38 ${8+i*11}, 61 ${75-i*7}, 78 ${39+i*2} S95 ${16+i*9},106 ${17+i*10}`} />
      <circle className="glyph-node" cx="106" cy={17+i*10} r="2" />
    </g>)}
  </>
}

function TokenLoss() {
  return <>
    <path className="glyph-faint" d="M13 61h93 M16 61V18" />
    {[13, 13, 13, 13, 13, 39].map((height, i) =>
      <rect key={i} className={i === 5 ? 'glyph-secondary' : undefined}
        x={22 + i * 13} y={60 - height} width="7" height={height} rx="1.5" />)}
    <path className="glyph-faint" d="M18 41h86" strokeDasharray="3 3" />
  </>
}

function RankFusion() {
  return <>
    <path className="glyph-faint" d="M18 24h24 M18 43h16 M18 62h22 M80 24h22 M80 43h15 M80 62h18" />
    <path d="M40 24C55 24 60 43 78 43 M38 62C53 62 63 62 78 62" />
    <path className="glyph-secondary" d="M32 43C53 43 57 24 78 24" />
    <Nodes points={[[40,24],[32,43],[38,62],[78,24],[78,43],[78,62]]} radius={2.6} />
  </>
}

function Preference() {
  return <>
    <path className="glyph-faint" d="M13 19v46h91 M16 42h85" strokeDasharray="3 3" />
    <path d="M17 42C39 42 41 22 66 21s28 0 36 0" />
    <path className="glyph-secondary" d="M17 42C39 42 41 60 66 61s28 0 36 0" />
    <Nodes points={[[17,42],[100,21],[100,61]]} />
  </>
}

function Distillation() {
  return <>
    <path className="glyph-faint" d="M9 60h36m24 0h37" />
    <path d="M13 57V20h7v37zm12 0V34h7v23zm12 0V48h7v9z" />
    <path d="M48 38h17m-5-5 5 5-5 5" />
    <path className="glyph-secondary" d="M72 57V25h7v32zm12 0V36h7v21zm12 0V47h7v10z" />
  </>
}

function DraftBlocks() {
  return <>
    <path className="glyph-faint" d="M11 48h61l14 11h17" strokeDasharray="3 3" />
    {[12, 36, 60].map(x => <rect key={x} x={x} y="22" width="17" height="17" rx="2" />)}
    <path d="m15 30 4 4 7-8m13 4 4 4 7-8" />
    <path className="glyph-secondary" d="m64 26 9 9m0-9-9 9m5 7v12h15" />
    <rect className="glyph-secondary" x="87" y="45" width="17" height="17" rx="2" />
  </>
}

function ContrastivePairs() {
  return <>
    <circle cx="20" cy="22" r="5" /><circle cx="16" cy="41" r="4" /><circle cx="26" cy="41" r="4" />
    <path d="m20 55 6 10H14z" />
    <path className="glyph-faint" d="M33 22h17m-17 19h17m-17 19h17" />
    {[0, 1, 2].map(row => [0, 1, 2].map(col =>
      <rect key={row * 3 + col} className={row === col ? 'glyph-secondary' : 'glyph-faint'}
        x={55 + col * 16} y={16 + row * 16} width="13" height="13" rx="2"
        fill={row === col ? 'currentColor' : 'none'} fillOpacity=".45" />))}
  </>
}

const glyphs: Record<string, ReactNode> = {
  'bpe-tokenizer': <Tree />,
  'embeddings-rope': <Rotation />,
  'attention-debugger': <Attention />,
  'norm-residual': <Residual />,
  'kv-cache-profiler': <Cache />,
  'flash-attention': <Tiling />,
  'moe-routing': <Routing />,
  quantization: <Quantization />,
  'decoding-sampling': <Tree beam />,
  'lora-svd': <LowRank />,
  'backprop-optimizers': <Contours />,
  'diffusion-flow': <Flow />,
  'language-model-loss': <TokenLoss />,
  'hybrid-retrieval': <RankFusion />,
  'preference-dpo': <Preference />,
  'knowledge-distillation': <Distillation />,
  'speculative-decoding': <DraftBlocks />,
  'image-text-contrastive': <ContrastivePairs />,
}

export default function LabPreviewIcon({ id }: { id: string }) {
  return <svg className="lab-preview-icon" viewBox="0 0 118 84" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true">
    {glyphs[id]}
  </svg>
}
