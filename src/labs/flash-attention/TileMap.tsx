import type { FlashConfig, FlashResult } from '../../engine/labs/flash-attention/engine'
import { useI18n } from '../../i18n'
import { flashVisuals } from '../../i18n/labs/flash-visuals'
const states=['pending','done','active','skipped'] as const
type TileState=typeof states[number]
export function TileMap({result,config,step,onStepChange}:{result:FlashResult;config:FlashConfig;step:number;onStepChange:(step:number)=>void}){
  const {locale}=useI18n(),t=flashVisuals[locale]
  const {seqLen:n,blockBr,blockBc}=config
  const current=result.trace[step]!
  const destinations=result.trace.flatMap((frame,index)=>frame.phase==='compute'||frame.phase==='skip'?[{frame,index}]:[])
  return <section className="flash-map"><h3>{t.trace}</h3>
    <svg viewBox={`0 0 ${n*10} ${n*10}`} aria-label={t.trace}>
      {destinations.map(({frame:f,index})=>{
        const isCurrent=current.i===f.i&&current.j===f.j
        const state:TileState=index<=step&&f.phase==='skip'?'skipped':isCurrent?'active':index<=step?'done':'pending'
        return <g key={index} data-tile-row={f.i} data-tile-col={f.j} data-tile-status={state} role="button" tabIndex={0}
          aria-label={`${t.current} (${f.i}, ${f.j}) · ${t[state]}`} onClick={()=>onStepChange(index)}
          onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();onStepChange(index)}}}>
          <rect className={'flash-state-'+state} x={f.colStart*10+.6} y={f.rowStart*10+.6} width={f.cols*10-1.2} height={f.rows*10-1.2}/>
          {Array.from({length:Math.min(blockBr,f.rows)},(_,i)=>Array.from({length:Math.min(blockBc,f.cols)},(_,j)=><rect key={i+'-'+j}
            x={(f.colStart+j)*10+1} y={(f.rowStart+i)*10+1} width="8" height="8"
            fill="none" stroke="var(--border-strong)" strokeWidth=".55"/>))}
        </g>
      })}
    </svg><div className="flash-key">{states.map(s=><span key={s}><i className={'flash-state-'+s}/>{t[s]}</span>)}</div>
  </section>
}
