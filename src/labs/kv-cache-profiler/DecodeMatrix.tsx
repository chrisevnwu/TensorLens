import { useId } from 'react'
import type { DecodeFrame } from '../../engine/labs/kv-cache-profiler/trace'
import { useI18n } from '../../i18n'
import { kvVisuals } from '../../i18n/labs/kv-visuals'
export type PathMode = 'cached' | 'uncached' | 'both'

export function DecodeMatrix({frame,path,mode}: {frame:DecodeFrame;path:'cached'|'uncached';mode:PathMode}) {
  const {locale} = useI18n()
  const t = kvVisuals[locale]
  const unique = useId().replace(/[^a-z0-9-]/gi,'')
  const data = frame[path]
  const side = Math.min(14,145/frame.length)
  const redundant = (r:number) => path==='uncached' && frame.phase==='decode' && r < frame.length-1
  const left=24
  const w=left+frame.length*side+2
  const h=33+data.queryRows.length*side
  return <section className="kv-matrix" data-focused={mode==='both'||mode===path}>
    <h3>{t[path]}</h3>
    <svg viewBox={`0 0 ${w} ${h}`} aria-label={t[path]} preserveAspectRatio="xMidYMin meet">
      <defs><pattern id={unique+'-repeat'} width="4" height="4" patternUnits="userSpaceOnUse">
        <rect width="4" height="4" fill="var(--bg-elevated)"/><path d="M-1 1L1 -1M0 4L4 0M3 5L5 3" stroke="var(--accent-warn)" strokeWidth="1"/>
      </pattern></defs>
      <text x="2" y="15">KV</text><text x="2" y="34">Q</text>
      {frame.tokenIds.map((id,index)=><rect key={index} x={left+index*side} y="5" width={side-1} height={side-1}
        fill={data.reusedRows.includes(index)?'var(--accent-tertiary)':redundant(index)?`url(#${unique}-repeat)`:'var(--accent-primary)'}>
        <title>KV[{index}], ID {id}</title></rect>)}
      {data.weights.map((row,i)=>row.map((value,j)=>{
        const q=data.queryRows[i]!, masked=j>q
        return <rect key={i+'-'+j} x={left+j*side} y={26+i*side} width={side-1} height={side-1}
          fill={masked?'var(--bg-elevated)':redundant(q)?`url(#${unique}-repeat)`:'var(--accent-primary)'}
          opacity={masked||redundant(q)?1:.3+.7*value}><title>A[{q},{j}] = {value.toFixed(4)}</title></rect>
      }))}
    </svg>
    <div className="kv-shape">Q ({data.queryRows.length} × {frame.dim}) · Kᵀ ({frame.dim} × {frame.length})</div>
    <p>{t.step} <output data-path-flops={path}>{data.flops}</output></p>
  </section>
}
