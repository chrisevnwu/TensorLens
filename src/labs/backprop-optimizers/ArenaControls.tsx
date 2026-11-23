import { SegmentedControl,SelectControl,SliderControl,ToggleControl } from '../../components/controls'
import { circuitLabels,type CircuitResult } from '../../engine/labs/backprop-optimizers/circuits'
import { OPTIMIZERS,type OptimizerId } from '../../engine/labs/backprop-optimizers/race'
import { useI18n } from '../../i18n'
import { optimizerCopy } from '../../i18n/labs/backprop-optimizers'
import { circuits,landscapes,schedules,type State } from './config'

interface Props {s:State;result:CircuitResult;visible:OptimizerId[];update:(changes:Partial<State>)=>void;optimize:()=>void}
export function ArenaControls({s,result,visible,update,optimize}:Props){
  const {locale}=useI18n(),t=optimizerCopy[locale],race=s.mode==='race'
  return <>
    <SegmentedControl label={t.mode} value={s.mode} options={(['race','graph'] as const).map(value=>({value,label:t.modes[value]}))}
      onChange={mode=>update({mode})}/>
    {race?<>
      <SelectControl label={t.landscape} value={s.landscape} options={landscapes.map(value=>({value,label:t.landscapes[value]}))} onChange={landscape=>update({landscape,raceStep:0,clicked:false})}/>
      <fieldset className="wb-control"><legend>{t.methods}</legend><div className="wb-segmented">{OPTIMIZERS.map(id=><button type="button" key={id}
        aria-pressed={visible.includes(id)} onClick={()=>update({visible:OPTIMIZERS.filter(value=>value===id?!visible.includes(id):visible.includes(value)).join(',')})}>{t.names[id]}</button>)}</div></fieldset>
      <SliderControl label="β₁" value={s.beta1} min={0} max={.99} step={.01} onChange={beta1=>update({beta1})}/>
      <SliderControl label="β₂" value={s.beta2} min={.5} max={.999} step={.001} onChange={beta2=>update({beta2})}/>
      <SliderControl label={t.decay} value={s.weightDecay} min={0} max={.5} step={.01} onChange={weightDecay=>update({weightDecay})}/>
      <SegmentedControl label={t.schedule} value={s.lrSchedule} options={schedules.map(value=>({value,label:t.schedules[value]}))} onChange={lrSchedule=>update({lrSchedule})}/>
    </>:<>
      <SelectControl label={t.circuit} value={s.circuit} options={circuits.map(value=>({value,label:t.circuits[value]}))} onChange={circuit=>update({circuit,graphStep:0,node:'',clipped:false})}/>
      {s.circuit==='neuron' && <SegmentedControl label={t.activation} value={s.activation} options={[{value:'relu',label:'ReLU'},{value:'gelu',label:'GELU'}]}
        onChange={activation=>update({activation,graphStep:0,node:''})}/>}
      {s.circuit==='residual' && <ToggleControl label={t.skip} checked={s.skipConnection} onChange={skipConnection=>update({skipConnection,graphStep:0,node:''})}/>}
      {result.checks.map(check=>{
        const key=check.key,bound=Math.max(3,Math.ceil(Math.abs(s[key])))
        return <SliderControl key={key} label={circuitLabels[key]} value={s[key]} min={-bound} max={bound} step={.05}
          format={v=>String(Number(v.toPrecision(6)))} onChange={v=>update({[key]:v,graphStep:0,clipped:false})}/>
      })}
    </>}
    <SliderControl label={t.learningRate} value={s.learningRate} min={.002} max={.3} step={.001} format={v=>v.toFixed(3)} onChange={learningRate=>update({learningRate})}/>
    {!race&&<div className="wb-segmented"><button type="button" onClick={optimize}>{t.optimize}</button></div>}
    {!race&&s.clipped&&<p role="status">{t.clip}</p>}
  </>
}
