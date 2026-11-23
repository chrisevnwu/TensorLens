import type { FlashConfig, FlashResult } from '../../engine/labs/flash-attention/engine'
import type { ScalingPoint } from '../../engine/labs/flash-attention/io'
import { MatrixHeatmap } from '../../components/viz/MatrixHeatmap'
import { useI18n } from '../../i18n'
import { flashVisuals } from '../../i18n/labs/flash-visuals'
import { HardwareDiagram } from './HardwareDiagram'
import { TileMap } from './TileMap'
import { FlashIO } from './FlashIO'
import './flash.css'

interface Props {
  result:FlashResult
  config:FlashConfig
  scaling:ScalingPoint[]
  step:number
  onStepChange:(step:number)=>void
}
const fmt=(n:number)=>n===-Infinity?'−∞':n.toFixed(4)
export function FlashStage({result,config,scaling,step,onStepChange}: Props){
  const {locale}=useI18n(),t=flashVisuals[locale]
  const f=result.trace[step]!
  return <div className="flash-stage">
    <HardwareDiagram result={result} step={step}/>
    <div className="flash-layout"><section className="flash-sram">
      <h3>{t.microtile}</h3>
      <div className="flash-tiles">
        {[
          {label:'Sᵢⱼ',values:f.scores,signed:true},{label:'Pᵢⱼ',values:f.p,signed:false},
          {label:f.phase==='write'?t.normalized:t.accumulator,values:f.accumulator,signed:true},
        ].filter(tile=>tile.values.length).map(tile=><figure key={tile.label}><figcaption>{tile.label}</figcaption>
          <MatrixHeatmap label={tile.label} values={tile.values} signed={tile.signed}/></figure>)}
      </div>
      {!f.scores.length&&<p>{t.noScore}</p>}
      <div className="flash-current">m = [{f.m.map(fmt).join(', ')}]<br/>ℓ = [{f.l.map(fmt).join(', ')}]</div>
    </section><TileMap {...{result,config,step,onStepChange}}/></div>
    <FlashIO {...{result,step,scaling}}/>
  </div>
}

export function FlashInspector({result,step}:Pick<Props,'result'|'step'>){
  const {locale}=useI18n(),t=flashVisuals[locale]
  const f=result.trace[step]!
  return <section className="flash-inspector"><h3>{t.current} · i = {f.i}{f.j>=0?`, j = ${f.j}`:''}</h3>
    <dl>{[
      [t.reads,f.reads],[t.writes,f.writes],
    ].map(([label,v])=><div key={label}><dt>{label}</dt><dd>{v}</dd></div>)}
      <div><dt>{t.skipped}</dt><dd><output data-skipped-tiles="">{f.skippedTiles}</output></dd></div>
    </dl>
    <div className="flash-number-scroll"><table><thead><tr>{[t.row,'m → m′','ℓ → ℓ′','α'].map(v=><th key={v}>{v}</th>)}</tr></thead>
      <tbody>{f.m.map((m,i)=><tr key={i}><th>{f.rowStart+i}</th><td>{fmt(f.mBefore[i]!)} → {fmt(m)}</td><td>{fmt(f.lBefore[i]!)} → {fmt(f.l[i]!)}</td>
        <td>{f.alpha[i]===undefined?'—':fmt(f.alpha[i]!)}</td></tr>)}</tbody></table></div>
    <details><summary>{t.matrixValues}</summary>
      {[['Sᵢⱼ',f.scores],['Pᵢⱼ',f.p],['Oᵢ',f.accumulator]].map(([key,values])=>{
        const rows=values as number[][]
        return rows.length>0&&<div className="flash-vectors" key={String(key)}><h4>{String(key)}</h4>
          {rows.map((row,i)=><code key={i}>[{row.map(fmt).join(', ')}]</code>)}</div>
      })}</details>
  </section>
}
