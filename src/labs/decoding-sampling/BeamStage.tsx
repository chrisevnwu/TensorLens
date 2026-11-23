import { useMemo } from 'react'
import type { BeamNode, BeamResult } from '../../engine/labs/decoding-sampling/beam'
import { useI18n } from '../../i18n'
import { beamCopy } from '../../i18n/labs/beam-visuals'
import './beam.css'

interface Props { result:BeamResult;step:number;selectedId:number;onSelect:(id:number)=>void }
function treeLayout(nodes:BeamNode[]) {
  const ys:number[]=Array(nodes.length).fill(0)
  let leaves=0
  function place(id:number):number {
    const children=nodes[id]!.children
    let y:number
    if(children.length){
      const positions=children.map(place)
      y=(positions[0]!+positions[positions.length-1]!)/2
    }else{ y=42+leaves*43;leaves++ }
    ys[id]=y
    return y
  }
  place(0)
  return {ys,height:leaves*43+25}
}

export function BeamStage({result,step,selectedId,onSelect}:Props) {
  const {locale}=useI18n(), t=beamCopy[locale]
  const {nodes}=result, frame=result.frames[step]!, best=nodes[frame.bestId]!
  const {ys,height}=useMemo(()=>treeLayout(nodes),[nodes])
  const maxDepth=Math.max(...nodes.map(node=>node.depth))
  const x=(depth:number)=>52+411*depth/Math.max(1,maxDepth)
  const status=(id:number)=>frame.activeIds.includes(id)?'active':frame.prunedIds.includes(id)?'pruned':frame.expandedIds.includes(id)?'expanded':'pending'
  return <div className="beam-stage"><h2>{t.title}</h2>
    <div className="beam-legend">{(['active','expanded','pruned','pending'] as const).map(state=>
      <span key={state} data-state={state}><i/>{t[state]}</span>)}</div>
    <p>{t.guide}</p>
    <svg role="group" aria-label={t.title} viewBox={`0 0 516 ${height}`}>
      {Array.from({length:maxDepth+1},(_,depth)=><text key={depth} x={x(depth)} y="12" textAnchor="middle" className="beam-axis">{t.depth} {depth}</text>)}
      {nodes.filter(node=>node.parent!==null).map(node=>{
        const parent=nodes[node.parent!]!
        const from=x(parent.depth)+40,to=x(node.depth)-40, mid=(from+to)/2
        return <path key={node.id} data-state={status(node.id)} className="beam-edge" fill="none"
          d={`M ${from} ${ys[parent.id]} C ${mid} ${ys[parent.id]}, ${mid} ${ys[node.id]}, ${to} ${ys[node.id]}`}/>
      })}
      {nodes.map(node=>{
        const label=node.token||t.root
        return <g key={node.id} role="button" tabIndex={0} aria-label={`${label} · ℓ ${node.logProb} · s ${node.score}`}
          className="beam-node" data-beam-node={node.id} data-state={status(node.id)}
          aria-pressed={selectedId===node.id} transform={`translate(${x(node.depth)} ${ys[node.id]})`}
          onClick={()=>onSelect(node.id)} onPointerEnter={()=>onSelect(node.id)} onFocus={()=>onSelect(node.id)}
          onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();onSelect(node.id)}}}>
          <title>{node.tokens.join(' ')||t.root} · {t[status(node.id)]} · ℓ={node.logProb}, s={node.score}</title>
          <rect x="-45" y="-17" width="90" height="34" rx="5"/>
          <text y="-1" textAnchor="middle">{label}</text>
          <text y="11" textAnchor="middle" className="beam-scores">ℓ {node.logProb.toFixed(2)} · s {node.score.toFixed(2)}</text>
        </g>
      })}
    </svg>
    <p className="beam-best">{t.path} <strong data-beam-best data-logprob={best.logProb}>{best.tokens.join(' ')||t.root}</strong></p>
  </div>
}

export function BeamInspector({result,selectedId}:Pick<Props,'result'|'selectedId'>){
  const {locale}=useI18n(), t=beamCopy[locale], node=result.nodes[selectedId]??result.nodes[0]!
  const fields=[
    [t.length,node.depth],[t.conditional,node.probability],[t.joint,Math.exp(node.logProb)],
    [t.log,node.logProb],[t.score,node.score],
  ] as const
  return <div className="beam-inspector"><h3>{t.selected}</h3><p>{node.tokens.join(' ')||t.root}</p>
    {!node.children.length&&<small>{t.finish}</small>}
    <dl>{fields.map(([name,value])=><div key={name}><dt>{name}</dt><dd title={String(value)}>{Number(value.toPrecision(10))}</dd></div>)}</dl>
  </div>
}
