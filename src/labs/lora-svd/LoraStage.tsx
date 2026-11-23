import { useMemo } from 'react'
import type { HeatCell } from '../../components/viz/MatrixHeatmap'
import { LineChart } from '../../components/viz/LineChart'
import type { LoraResult } from '../../engine/labs/lora-svd/engine'
import { useI18n } from '../../i18n'
import { loraVisuals } from '../../i18n/labs/lora-visuals'
import { FactorTile } from './FactorTile'
import './lora.css'

interface Props {
  result:LoraResult;step:number;cell:HeatCell;onSelectCell:(cell:HeatCell)=>void
  onStepChange:(step:number)=>void;onRankChange:(rank:number)=>void
}
export function LoraStage({result,step,cell,onSelectCell,onStepChange,onRankChange}:Props){
  const {locale}=useI18n(),t=loraVisuals[locale]
  const {target,approximation}=result, frame=result.frames[step]!
  const rank=frame.A.rows
  const eff=useMemo(()=>target.base.add(frame.delta),[target,frame])
  const bound=useMemo(()=>Math.max(1e-12,...target.delta.data.map(Math.abs)),[target])
  const losses=useMemo(()=>result.frames.map(f=>f.mse),[result])
  const floor=useMemo(()=>result.frames.map(()=>approximation.svdFloorMse),[result,approximation.svdFloorMse])
  const {S}=target.svd
  const peak=S[0]||1
  const selected={cell,onSelectCell}
  return <div className="lora-stage" data-adapter-mse={frame.mse} data-svd-floor={approximation.svdFloorMse} data-explained-energy={approximation.explainedEnergy}><section><h2>{t.factors}</h2>
    <p className="lora-formula">Wₑff = W₀ + (α/r)BA ≈ W₀ + ΔW</p>
    <div className="lora-factors">
      <FactorTile label="B" name="B" matrix={frame.B}/><span>×</span>
      <FactorTile label="A" name="A" matrix={frame.A}/><span>→</span>
      <FactorTile label="(α/r)BA" name="delta" matrix={frame.delta} domain={bound} {...selected}/>
    </div>
    <div className="lora-grids">
      <FactorTile label={t.base} name="base" matrix={target.base} {...selected}/>
      <FactorTile label={t.effective} name="effective" matrix={eff} {...selected}/>
      <FactorTile label={t.target} name="target" matrix={target.delta} domain={bound} {...selected}/>
      <FactorTile label={t.residual} name="residual" matrix={frame.residual} domain={bound} {...selected}/>
    </div></section>
    <section className="lora-spectrum"><h3>{t.spectrum}</h3>
      <div className="lora-legend"><span><i/>{t.captured}</span><span><i/>{t.discarded}</span>
        <span>{t.energy} <b>{(approximation.explainedEnergy*100).toFixed(2)}%</b></span></div>
      <svg viewBox="0 0 410 98" aria-label={t.spectrum}>
        <text x="3" y="10">σ</text><line x1="16" x2="403" y1="76" y2="76" stroke="var(--border-strong)"/>
        {S.map((v,i)=>{
          const x=16+i*24,h=67*v/peak,select=()=>onRankChange(i+1)
          return <g key={i} role="button" tabIndex={0} aria-label={`r = ${i+1}`} aria-pressed={rank===i+1} data-singular-index={i}
            onClick={select} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();select()}}}>
            <title>σ{i+1} = {v.toPrecision(6)}</title><rect x={x} y="6" width="24" height="90" fill="transparent"/>
            <rect x={x+3} y={76-h} width="18" height={h} fill={i<rank?'var(--accent-primary)':'var(--text-muted)'} />
            <text x={x+12} y="89" textAnchor="middle">{i+1}</text></g>
        })}
      </svg>
    </section>
    <LineChart label={t.loss} xLabel={t.step} selectedIndex={step} onSelectIndex={onStepChange} scale="symlog" logThreshold={1e-6}
      series={[{label:t.fit,color:'var(--accent-tertiary)',values:losses},
        {label:t.floor,color:'var(--accent-warn)',dashed:true,values:floor}]}/>
  </div>
}
export function LoraInspector({result,step,cell}:Pick<Props,'result'|'step'|'cell'>){
  const {locale}=useI18n(),t=loraVisuals[locale]
  const {row,col}=cell,frame=result.frames[step]!,target=result.target
  return <section className="lora-inspector"><h3>{t.cell} [{row}, {col}]</h3>
    <dl>{[
      [t.base,target.base.get(row,col)],[t.target,target.delta.get(row,col)],[t.update,frame.delta.get(row,col)],
      [t.effective,target.base.get(row,col)+frame.delta.get(row,col)],[t.residual,frame.residual.get(row,col)],
      [t.optimal,result.approximation.optimal.get(row,col)],
    ].map(([label,v])=><div key={label}><dt>{label}</dt><dd title={String(v)}>{Number(v).toPrecision(7)}</dd></div>)}</dl>
    <p>B[{row}, :] <code>[{Array.from(frame.B.row(row),v=>v.toFixed(4)).join(', ')}]</code></p>
    <p>A[:, {col}] <code>[{Array.from({length:frame.A.rows},(_,i)=>frame.A.get(i,col).toFixed(4)).join(', ')}]</code></p>
  </section>
}
