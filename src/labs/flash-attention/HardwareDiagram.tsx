import type { FlashResult } from '../../engine/labs/flash-attention/engine'
import { divergingColor } from '../../engine/math/colormaps'
import { useAppStore } from '../../store/useAppStore'
import { useI18n } from '../../i18n'
import { flashVisuals } from '../../i18n/labs/flash-visuals'

export function HardwareDiagram({result,step}:{result:FlashResult;step:number}){
  const {locale}=useI18n(),t=flashVisuals[locale]
  const theme=useAppStore(s=>s.theme)
  const f=result.trace[step]!
  const writeFrames=result.trace.slice(0,step+1).filter(s=>s.phase==='write')
  const panels=[['Q',result.Q],['K',result.K],['V',result.V],['O',result.flashOutput]] as const
  const transfer=f.phase==='load-q'||f.phase==='load-kv'||f.phase==='write'
  return <section className="flash-hardware"><h2>{t.hardware}<small data-flash-phase={f.phase}>{t[f.phase]}</small></h2>
    <svg viewBox="0 0 390 151" role="img" aria-label={`${t.hbm} ↔ ${t.sram}, ${t[f.phase]}`}>
      <rect x="1" y="1" width="388" height="114" rx="6" className="flash-chip-box"/>
      <text x="11" y="15">{t.hbm} · HBM</text>
      {panels.map(([name,matrix],idx)=>{
        const x=32+idx*91, y=34, ch=70/matrix.rows,cw=10
        const isOutput=name==='O'
        const focusStart=name==='Q'||isOutput?f.rowStart:f.colStart
        const focusRows=name==='Q'||isOutput?f.rows:f.cols
        const focus=(name==='Q' && f.phase==='load-q')||((name==='K'||name==='V')&&(f.phase==='load-kv'||f.phase==='compute'))||(isOutput && f.phase==='write')
        const limit=Math.max(1e-12,...Array.from(matrix.data,Math.abs))
        return <g key={name}><text x={x+20} y="29" textAnchor="middle">{name}</text>
          {matrix.to2D().map((row,i)=>row.map((v,j)=>{
            const available=!isOutput||writeFrames.some(s=>i>=s.rowStart&&i<s.rowStart+s.rows)
            return <rect key={i+'-'+j} x={x+j*cw} y={y+i*ch} width={cw-.6} height={ch-.4}
              fill={available?divergingColor(v,limit,theme):'var(--bg-elevated)'}><title>{name}[{i},{j}] {available?v.toFixed(4):t.unwritten}</title></rect>
          }))}
          {focus&&<rect x={x-1} y={y+focusStart*ch-.5} width={matrix.cols*cw+1} height={focusRows*ch+.2}
            fill="none" stroke="var(--accent-warn)" strokeWidth="1.7"/>}
        </g>
      })}
      <path d="M195 116v15" stroke={transfer?'var(--accent-primary)':'var(--border-strong)'} className={transfer?'flash-transfer':''}/>
      {transfer&&<path d={f.phase==='write'?'m191 122 4-5 4 5':'m191 125 4 5 4-5'} fill="none" stroke="var(--accent-primary)"/>}
      <rect x="61" y="132" width="268" height="18" rx="4" className="flash-chip-box"/>
      <text x="195" y="145" textAnchor="middle">{t.sram} · m, ℓ, Oᵢ</text>
    </svg>
  </section>
}
