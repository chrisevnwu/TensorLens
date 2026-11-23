import { LineChart } from '../../components/viz/LineChart'
import type { MoeResult } from '../../engine/labs/moe-routing/engine'
import { useI18n } from '../../i18n'
import { moeVisuals } from '../../i18n/labs/moe-visuals'
import { RouterGraph, type MoeSelection } from './RouterGraph'
import './moe.css'

export type { MoeSelection } from './RouterGraph'
interface Props {result:MoeResult;step:number;selection:MoeSelection;onSelect:(next:MoeSelection)=>void;onStepChange:(step:number)=>void}

export function MoeStage({result,step,selection,onSelect,onStepChange}:Props){
  const {locale}=useI18n(),t=moeVisuals[locale]
  const frame=result.frames[step]!
  return <div className="moe-stage"><RouterGraph {...{frame,selection,onSelect}} tokens={result.tokens}/>
    <LineChart label={t.history} xLabel={t.step} selectedIndex={step} onSelectIndex={onStepChange} series={[
      {label:t.cv,color:'var(--accent-primary)',values:result.frames.map(f=>f.loadCV)},
      {label:t.aux,color:'var(--accent-secondary)',values:result.frames.map(f=>f.auxLoss)},
    ]}/>
  </div>
}

export function MoeInspector({result,step,selection}:Pick<Props,'result'|'step'|'selection'>){
  const {locale}=useI18n(),t=moeVisuals[locale]
  const frame=result.frames[step]!,index=selection.index
  const token=selection.kind==='token'
  const routes=frame.routes.filter(r=>r[selection.kind]===index)
  return <div className="moe-inspector"><h3>{token?t.token:t.expert} {index}</h3>
    {token?<p>{t[result.tokens[index]!.domain]} · {t.gates}</p>:<p>{t.accepted} {frame.accepted[index]} / {frame.assigned[index]} · {t.capacity} {frame.capacity}<br/>
      {t.bias} {frame.selectionBias[index]!.toFixed(5)}</p>}
    {(token||routes.length>0)?<table><thead><tr><th>{token?t.expert:t.token}</th><th>p</th><th>{t.weight}</th><th>{t.status}</th></tr></thead>
      <tbody>{(token?frame.probs[index]!.map((p,expert)=>({id:expert,p,route:routes.find(r=>r.expert===expert)}))
        :routes.map(route=>({id:route.token,p:route.probability,route}))).map(({id,p,route})=>
          <tr key={id} data-accepted={route?!route.dropped:undefined}><th>{token?'E':'T'}{id}</th>
            <td data-prob-expert={token?id:undefined}>{p.toFixed(6)}</td><td data-gate-expert={token?id:undefined}>{route?route.weight.toFixed(6):'—'}</td>
            <td>{!route?t.unselected:route.dropped?t.dropped:t.accepted}</td></tr>)}</tbody>
    </table>:<p>{t.empty}</p>}
  </div>
}
