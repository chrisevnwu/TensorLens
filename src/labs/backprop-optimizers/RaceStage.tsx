import {useMemo} from 'react'
import {LineChart,formatPlotValue} from '../../components/viz/LineChart'
import type {Landscape} from '../../engine/labs/backprop-optimizers/landscape'
import type {RaceFrame,OptimizerId} from '../../engine/labs/backprop-optimizers/race'
import {useI18n} from '../../i18n'
import {raceVisuals} from '../../i18n/labs/race-visuals'
import {RaceCanvas,outside} from './RaceCanvas'
import './race.css'
const color:Record<OptimizerId,string>={sgd:'var(--accent-primary)',momentum:'var(--accent-secondary)',rmsprop:'var(--accent-tertiary)',adam:'var(--accent-warn)',adamw:'var(--accent-danger)'}
interface Props {frames:RaceFrame[];landscape:Landscape;step:number;visible:readonly OptimizerId[];onStartChange:(x:number,y:number)=>void;onStepChange:(step:number)=>void}
export function RaceStage({frames,landscape,step,visible,onStartChange,onStepChange}:Props){
  const {locale}=useI18n(),t=raceVisuals[locale]
  const losses=useMemo(()=>visible.map(id=>({label:t[id],color:color[id],values:frames.map(f=>f.points[id].loss)})),[frames,visible,t])
  const rates=useMemo(()=>frames.map(f=>f.learningRate),[frames])
  return <div className="race-stage"><RaceCanvas {...{frames,step,visible,landscape,onStartChange}}/>
    <div className="race-key">{visible.map(id=>{
      const p=frames[step]!.points[id],note=p.diverged?t.diverged:outside(p)?t.outside:''
      return <span key={id} data-optimizer={id} data-x={p.x} data-y={p.y} data-loss={p.loss} data-diverged={p.diverged}>
        <i style={{background:color[id]}}/>{t[id]} {note&&<b>{note}</b>}</span>
    })}</div>
    {visible.length?<LineChart label={t.loss} xLabel={t.step} series={losses} selectedIndex={step} onSelectIndex={onStepChange} scale="symlog" logThreshold={1e-5}/>:<p>{t.none}</p>}
    <LineChart label={t.lr} xLabel={t.step} series={[{label:'η',color:'var(--accent-primary)',values:rates}]} selectedIndex={step} onSelectIndex={onStepChange}/>
  </div>
}
export function RaceInspector({frames,step,visible}:Pick<Props,'frames'|'step'|'visible'>){
  const {locale}=useI18n(),t=raceVisuals[locale]
  return <section className="race-inspector"><h3>{t.state}</h3>
    {visible.map(id=>{
      const p=frames[step]!.points[id]
      return <div key={id}><h4><i style={{background:color[id]}}/>{t[id]}</h4>
        <dl><dt>{t.position}</dt><dd>({formatPlotValue(p.x)}, {formatPlotValue(p.y)})</dd>
          <dt>f(x, y)</dt><dd>{formatPlotValue(p.loss)}</dd><dt>{t.gradient}</dt><dd>{formatPlotValue(p.gradNorm)}</dd></dl>
      </div>
    })}
  </section>
}
