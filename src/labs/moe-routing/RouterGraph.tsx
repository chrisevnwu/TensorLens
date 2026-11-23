import type { KeyboardEvent } from 'react'
import type { MoeFrame, MoeToken } from '../../engine/labs/moe-routing/engine'
import { useI18n } from '../../i18n'
import { moeVisuals } from '../../i18n/labs/moe-visuals'

export interface MoeSelection {kind:'token'|'expert';index:number}
const colors={code:'var(--accent-primary)',math:'var(--accent-secondary)',prose:'var(--accent-tertiary)',logic:'var(--accent-warn)'}
const trigger=(event:KeyboardEvent<SVGGElement>,fn:()=>void)=>{
  if(event.key==='Enter'||event.key===' '){event.stopPropagation();event.preventDefault();fn()}
}
export function RouterGraph({tokens,frame,selection,onSelect}:{
  tokens:MoeToken[];frame:MoeFrame;selection:MoeSelection;onSelect:(next:MoeSelection)=>void
}){
  const {locale}=useI18n(),t=moeVisuals[locale]
  const height=Math.max(164,tokens.length*15+13,frame.assigned.length*32+10)
  const tokenY=(i:number)=>10+(i+.5)*(height-20)/tokens.length
  const expertY=(i:number)=>10+(i+.5)*(height-20)/frame.assigned.length
  const maxLoad=Math.max(frame.capacity,...frame.assigned)
  const active=frame.routes.filter(r=>r[selection.kind]===selection.index)
  const hotTokens=new Set(active.map(r=>r.token)), hotExperts=new Set(active.map(r=>r.expert))
  const order=[...frame.routes].sort((a,b)=>Number(a[selection.kind]===selection.index)-Number(b[selection.kind]===selection.index))
  return <section className="moe-router"><h2>{t.routing}</h2>
    <div className="moe-legend">
      {Object.entries(colors).map(([key,color])=><span key={key}><i style={{background:color}}/>{t[key as MoeToken['domain']]}</span>)}
      <span><i className="moe-drop-key"/>{t.dropped}</span>
    </div>
    <svg viewBox={`0 0 450 ${height}`} aria-label={t.routing}>
      {order.map(r=>{
        const highlighted=r[selection.kind]===selection.index
        const color=r.dropped?'var(--accent-danger)':colors[tokens[r.token]!.domain]
        const expertRoutes=frame.routes.filter(route=>route.expert===r.expert)
        const slot=expertRoutes.findIndex(route=>route.token===r.token)
        const end=expertY(r.expert)-4+8*(slot+.5)/expertRoutes.length
        return <path key={r.token+'-'+r.expert} data-route={`${r.token}-${r.expert}`} data-dropped={r.dropped}
          d={`M79 ${tokenY(r.token)} C161 ${tokenY(r.token)} 223 ${end} 290 ${end}`}
          fill="none" stroke={color} strokeDasharray={r.dropped?'4 3':undefined} strokeWidth={.6+5.5*r.weight}
          opacity={highlighted?.95:.22} onPointerEnter={()=>onSelect({kind:'token',index:r.token})}>
          <title>{`T${r.token} → E${r.expert} · p=${r.probability.toFixed(6)}, g=${r.weight.toFixed(6)} · ${r.dropped?t.dropped:t.accepted}`}</title>
        </path>
      })}
      {tokens.map(token=>{
        const selected=selection.kind==='token'&&token.id===selection.index
        const select=()=>onSelect({kind:'token',index:token.id})
        return <g key={token.id} data-token={token.id} role="button" tabIndex={0} aria-label={`${t.token} ${token.id} · ${t[token.domain]}`}
          aria-pressed={selected} onFocus={select} onPointerEnter={select} onClick={select} onKeyDown={e=>trigger(e,select)}>
          <rect x="2" y={tokenY(token.id)-6.3} width="77" height="12.6" rx="3" fill="var(--bg-elevated)" stroke={selected||hotTokens.has(token.id)?colors[token.domain]:'var(--border-subtle)'}/>
          <circle cx="9" cy={tokenY(token.id)} r="2.7" fill={colors[token.domain]}/>
          <text x="15" y={tokenY(token.id)+3}>T{token.id} · {t[token.domain]}</text>
        </g>
      })}
      {frame.assigned.map((assigned,e)=>{
        const select=()=>onSelect({kind:'expert',index:e})
        const y=expertY(e), barX=299, barWidth=140
        const selected=selection.kind==='expert'&&selection.index===e
        const capX=barX+barWidth*frame.capacity/maxLoad
        const accepted=frame.accepted[e]!
        return <g key={e} role="button" data-expert={e} tabIndex={0} aria-label={`${t.expert} ${e}`}
          aria-pressed={selected} onFocus={select} onPointerEnter={select} onClick={select} onKeyDown={event=>trigger(event,select)}>
          <rect x="290" y={y-12} width="157" height="25" rx="3" fill="var(--bg-canvas)" stroke={selected||hotExperts.has(e)?'var(--accent-primary)':'var(--border-strong)'}/>
          <text x={barX} y={y-1}>E{e}</text><text x="438" y={y-1} textAnchor="end">{accepted}/{assigned}</text>
          <rect x={barX} y={y+3} width={barWidth} height="5" fill="var(--bg-elevated)"/>
          <rect x={barX} y={y+3} width={barWidth*accepted/maxLoad} height="5" fill="var(--accent-tertiary)"/>
          <rect x={barX+barWidth*accepted/maxLoad} y={y+3} width={barWidth*(assigned-accepted)/maxLoad} height="5" fill="var(--accent-danger)"/>
          <line x1={capX} x2={capX} y1={y+1} y2={y+10} stroke="var(--accent-warn)" strokeWidth="1.3"/>
        </g>
      })}
    </svg>
    <p>{t.fit} · {t.capacity} = {frame.capacity}</p>
  </section>
}
