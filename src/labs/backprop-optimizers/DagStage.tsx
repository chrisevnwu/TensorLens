import { useMemo } from 'react'
import type { CircuitResult } from '../../engine/labs/backprop-optimizers/circuits'
import type { AutogradNodeSnapshot } from '../../engine/math/autograd'
import { useI18n } from '../../i18n'
import { dagCopy } from '../../i18n/labs/dag-visuals'
import './dag.css'

interface Props {result:CircuitResult;step:number;selectedId:string;onSelect:(id:string)=>void}
function compact(v:number) {return String(Number(v.toPrecision(4)))}
function readableLabel(node:AutogradNodeSnapshot) {
  const numeric=Number(node.label)
  return Number.isFinite(numeric) && node.label.trim() ? compact(numeric) : node.label
}
function positionGraph(nodes:AutogradNodeSnapshot[]) {
  const depth=new Map<string,number>(),levels:AutogradNodeSnapshot[][]=[]
  for(const node of nodes){
    const col=node.parentIds.length?1+Math.max(...node.parentIds.map(id=>depth.get(id)!)):0
    depth.set(node.id,col)
    ;(levels[col]??=[]).push(node)
  }
  const height=Math.max(150,86*Math.max(...levels.map(col=>col.length)))
  const positions=new Map<string,{x:number;y:number}>()
  levels.forEach((level,c)=>level.forEach((node,r)=>positions.set(node.id,{x:52+115*c,y:height*(r+.5)/level.length})))
  return {positions,height,width:104+115*(levels.length-1)}
}
function current(result:CircuitResult,step:number,selectedId:string){
  const nodes=result.trace[step]!
  const active=nodes[Math.min(nodes.length-1,nodes.length-step)]!
  return {nodes,active,selected:nodes.find(n=>n.id===selectedId)??active}
}

export function DagStage({result,step,selectedId,onSelect}:Props) {
  const {locale}=useI18n(),t=dagCopy[locale]
  const {nodes,active,selected}=current(result,step,selectedId)
  const {positions,height,width}=useMemo(()=>positionGraph(result.trace[0]!),[result])
  return <section className="dag-stage"><h2>{t.title}</h2><p>{t.help}</p>
    <div className="dag-scroll" role="region" aria-label={t.title} tabIndex={0}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{minWidth:width*.76}} aria-label={t.title}>
        {nodes.flatMap(node=>node.parentIds.map((parent,slot)=>{
          const a=positions.get(parent)!, b=positions.get(node.id)!
          const start=a.x+38,end=b.x-38,middle=(start+end)/2
          const hot=node.id===active.id&&step>0
          const yEnd=b.y+8*(slot-(node.parentIds.length-1)/2)
          return <g key={node.id+'-'+slot} className="dag-edge" data-hot={hot}>
            <path d={`M${start} ${a.y} C ${middle} ${a.y}, ${middle} ${yEnd}, ${end} ${yEnd}`} fill="none"/>
            <text x={middle} y={(a.y+yEnd)/2-3} textAnchor="middle">{compact(node.localDerivatives[slot]!)}</text>
            <title>{t.partial} ∂{node.label}/∂{nodes.find(n=>n.id===parent)!.label} = {node.localDerivatives[slot]}</title>
          </g>
        }))}
        {nodes.map(node=>{
          const {x,y}=positions.get(node.id)!
          return <g key={node.id} transform={`translate(${x} ${y})`} role="button" tabIndex={0}
            data-node-id={node.id} data-node-label={node.label} data-node-grad={node.grad} className="dag-node"
            data-active={active.id===node.id} aria-pressed={selected.id===node.id} aria-label={node.label+' · '+t.op[node.op]}
            onPointerEnter={()=>onSelect(node.id)} onClick={()=>onSelect(node.id)} onFocus={()=>onSelect(node.id)}
            onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();onSelect(node.id)}}}>
            <title>{node.label} · {t.op[node.op]} · {t.value} {node.value} · {t.gradient} {node.grad}</title>
            <rect x="-39" y="-27" width="78" height="54" rx="5"/>
            <text y="-10" textAnchor="middle" className="dag-op">{readableLabel(node)}</text>
            <text y="5" textAnchor="middle">v {compact(node.value)}</text>
            <text y="19" textAnchor="middle" className="dag-adjoint">∂ {compact(node.grad)}</text>
          </g>
        })}
      </svg>
    </div>
    <p className="dag-scroll-hint">{t.swipe}</p>
    <p className="dag-now">{step?t.active:t.seed} <strong>{active.label}</strong> · ∂L/∂{active.label} = {compact(active.grad)}</p>
  </section>
}

export function DagInspector({result,step,selectedId}:Pick<Props,'result'|'step'|'selectedId'>){
  const {locale}=useI18n(),t=dagCopy[locale],{nodes,selected}=current(result,step,selectedId)
  return <div className="dag-inspector"><h3>{selected.label} · {t.op[selected.op]}</h3>
    <dl><div><dt>{t.value}</dt><dd>{String(selected.value)}</dd></div>
      <div><dt>{t.gradient}</dt><dd>{String(selected.grad)}</dd></div></dl>
    {!!selected.parentIds.length&&<table><thead><tr><th>{t.parent}</th><th>{t.partial}</th><th>{t.incoming}</th></tr></thead>
      <tbody>{selected.parentIds.map((id,i)=><tr key={id+'-'+i}><th>{readableLabel(nodes.find(n=>n.id===id)!)}</th>
        <td title={String(selected.localDerivatives[i])}>{compact(selected.localDerivatives[i]!)}</td>
        <td>{compact(selected.grad*selected.localDerivatives[i]!)}</td></tr>)}</tbody></table>}
    <h4>{t.checks}</h4>
    <table className="dag-checks"><thead><tr><th>{t.quantity}</th><th>{t.analytical}</th><th>{t.central}</th><th>{t.error}</th></tr></thead>
      <tbody>{result.checks.map(check=><tr key={check.key} data-variable={check.key}>
        <th>{check.label}{check.kink?'*':''}</th>
        {[check.analytical,check.numerical,check.error].map((v,i)=><td key={i} title={String(v)}>{compact(v)}</td>)}
      </tr>)}</tbody></table>
    {result.checks.some(c=>c.kink)&&<p>* {t.kink}</p>}
  </div>
}
