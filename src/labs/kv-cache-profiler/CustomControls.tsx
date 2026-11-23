import { useState } from 'react'
import { SelectControl } from '../../components/controls'
import { useI18n } from '../../i18n'
import { kvCopy } from '../../i18n/labs/kv-cache-profiler'
import { customRanges, type KvState } from './config'

interface NumericProps { name:string; label:string; value:number; range:readonly [number,number,number]; onCommit:(n:number)=>void }
function NumericField({name,label,value,range:[min,max,step],onCommit}:NumericProps) {
  const [draft,setDraft]=useState<string|null>(null)
  return <label className="wb-control kv-number">{label}
    <input name={name} type="number" min={min} max={max} step={step} value={draft ?? value}
      onChange={e=>setDraft(e.currentTarget.value)}
      onKeyDown={e=>{if(e.key==='Enter') e.currentTarget.blur()}}
      onBlur={()=>{
        if (draft !== null && draft.trim() && Number.isFinite(Number(draft))) {
          const snapped=min+Math.round((Number(draft)-min)/step)*step
          onCommit(Number(Math.max(min,Math.min(max,snapped)).toFixed(1)))
        }
        setDraft(null)
      }} />
  </label>
}

export function CustomControls({state,update}:{state:KvState;update:(s:Partial<KvState>)=>void}) {
  const {locale}=useI18n()
  const t=kvCopy[locale]
  const keys = Object.keys(customRanges) as (keyof typeof customRanges)[]
  const labels={paramsB:t.params,layers:t.layers,qHeads:t.qHeads,kvHeads:t.kvHeads,headDim:t.headDim,latentDim:t.latent,ropeDim:t.rope,hiddenSize:t.hidden}
  return <div className="kv-custom">{keys.map(key=><NumericField key={key} name={key} label={labels[key]} value={state[key]}
    range={customRanges[key]} onCommit={n=>update({[key]:n})} />)}
    <SelectControl label={t.weightBytes} value={state.weightBytes}
      options={[.5,1,2,4].map(value=>({value,label:String(value)}))} onChange={weightBytes=>update({weightBytes})}/>
  </div>
}
