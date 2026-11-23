import {useMemo} from 'react'
import {SOLVERS,type DiffusionResult,type DiffusionConfig,type SolverFrame,type SolverId} from '../../engine/labs/diffusion-flow/engine'
import {fieldGrid,type FieldVector} from '../../engine/labs/diffusion-flow/grid'
import {useI18n} from '../../i18n'
import {diffusionVisuals} from '../../i18n/labs/diffusion-visuals'
import {ParticleCanvas} from './ParticleCanvas'
import './diffusion.css'

interface Props {result:DiffusionResult;config:DiffusionConfig;step:number;showVectorField:boolean;showTrails:boolean;selected:number;onSelect:(index:number)=>void}

export function DiffusionStage({result,config,step,showVectorField,showTrails,selected,onSelect}:Props){
  const {locale}=useI18n(),t=diffusionVisuals[locale]
  const panels=SOLVERS.flatMap(solver=>{
    const frames=result.runs[solver]
    return frames?[{solver,frames}]:[]
  })
  const extent=useMemo(()=>{
    let edge=2
    for(const p of result.target)edge=Math.max(edge,Math.abs(p.x),Math.abs(p.y))
    for(const frames of Object.values(result.runs))for(const frame of frames)
      for(const p of frame.particles)edge=Math.max(edge,Math.abs(p.x),Math.abs(p.y))
    return Math.ceil(edge*2)/2
  },[result])
  const makeField=useMemo(()=>{
    const cache=new Map<string,FieldVector[]>()
    return (solver:SolverId,frame:SolverFrame)=>{
      const kind=solver==='flow'?'flow':'ddim',key=kind+'-'+frame.time
      let vectors=cache.get(key)
      if(!vectors){
        vectors=fieldGrid(result.target,kind,frame.time,config.schedule,config.targetClass,config.cfgScale,extent)
        cache.set(key,vectors)
      }
      return vectors
    }
  },[result.target,config.cfgScale,config.schedule,config.targetClass,extent])
  const first=panels[0]!.frames[step]!
  return <section className="diffusion-stage">
    <h2>{panels.length>1?t.compare:t.swarm}</h2>
    <div className="diffusion-key">
      <span><i className="diff-a"/>{t.classA}</span><span><i className="diff-b"/>{t.classB}</span>
      <span><i className="diff-particles"/>{t.particles}</span>
      {showTrails&&<><span><i className="diff-trails"/>{t.trails}</span>
        <span><i className="diff-selected"/>{t.selectedTrail}</span></>}
      {showVectorField&&<span><i className="diff-field"/>{panels.length>1?`${t.score} / ${t.velocity}`:panels[0]!.solver==='flow'?t.velocity:t.score}</span>}
    </div>
    <div className="diffusion-panels" data-compare={panels.length>1}>{panels.map(({solver,frames})=>
      <ParticleCanvas key={solver} target={result.target} {...{solver,frames,step,extent,selected}} onSelect={onSelect}
        field={showVectorField?makeField(solver,frames[step]!):[]} compact={panels.length>1} trails={showTrails}/>)}</div>
    <label className="diffusion-choice">{t.particle} <input type="range" min="0" max={first.particles.length-1} value={selected}
      onChange={e=>onSelect(e.currentTarget.valueAsNumber)}/><output>#{selected}</output></label>
  </section>
}

export function DiffusionInspector({result,step}:Pick<Props,'result'|'config'|'step'>){
  const {locale}=useI18n(),t=diffusionVisuals[locale]
  return <div className="diffusion-inspector"><h3>{t.stats}</h3>{SOLVERS.map(solver=>{
    const f=result.runs[solver]?.[step]
    if(!f)return null
    return <section key={solver}><h4>{t[solver]}</h4>
      <dl>{[[t.clock,f.time.toFixed(3)],[t.distance,f.meanDistance.toFixed(5)],[t.straightness,f.straightness.toFixed(4)],
        [t.purity,(100*f.purityA).toFixed(1)+'%']].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
    </section>
  })}</div>
}
