import { useMemo } from 'react'
import { SegmentedControl, SliderControl } from '../../components/controls'
import { ExperimentShell } from '../../components/layout/ExperimentShell'
import { choiceField, makeUrlCodec, numberField, useLabUrlState, type UrlStateCodec } from '../../components/utils/useLabUrlState'
import { FormulaBar } from '../../components/viz/FormulaBar'
import { simulateMoe, type MoeConfig } from '../../engine/labs/moe-routing/engine'
import { MOE_PRESETS, type MoePresetId } from '../../engine/labs/moe-routing/presets'
import { useI18n } from '../../i18n'
import { moeCopy } from '../../i18n/labs/moe-routing'
import { MoeStage, MoeInspector, type MoeSelection } from './MoeStage'

interface State extends MoeConfig, MoeSelection {preset:MoePresetId;step:number}
const experts=[4,6,8], ks=[1,2,3]
const modes: MoeConfig['balancingMode'][]=['none','aux-loss','loss-free-bias']
function presetState(id:MoePresetId):State {
  const {id:preset,...config}=MOE_PRESETS.find(p=>p.id===id) ?? MOE_PRESETS[0]
  return {...config,preset,step:0,kind:'token',index:0}
}
function normalize(s:State):State {
  return {...s,index:Math.min(s.index,(s.kind==='expert'?s.numExperts:s.numTokens)-1)}
}
const initial=presetState('balanced')
const fields=makeUrlCodec<State>({
  preset:choiceField(MOE_PRESETS.map(p=>p.id)),numTokens:numberField(8,24,1),numExperts:choiceField(experts),topK:choiceField(ks),
  capacityFactor:numberField(.75,2,.05),balancingMode:choiceField(modes),auxAlpha:numberField(0,.2,.01),routerNoise:numberField(0,.5,.01),
  kind:choiceField(['token','expert']),index:numberField(0,23,1),step:numberField(0,30,1),
})
const codec:UrlStateCodec<State>={
  encode:fields.encode,
  decode(params){
    const preset=MOE_PRESETS.find(p=>p.id===params.get('preset'))??MOE_PRESETS[0]
    return normalize(fields.decode(params,presetState(preset.id)))
  },
}

export default function MoeLab() {
  const {locale}=useI18n()
  const t=moeCopy[locale]
  const {state:s,setState,getShareUrl}=useLabUrlState(initial,codec)
  const {numTokens,numExperts,topK,capacityFactor,balancingMode,auxAlpha,routerNoise}=s
  const result=useMemo(()=>simulateMoe({numTokens,numExperts,topK,capacityFactor,balancingMode,auxAlpha,routerNoise}),
    [numTokens,numExperts,topK,capacityFactor,balancingMode,auxAlpha,routerNoise])
  const f=result.frames[s.step]!
  const selection={kind:s.kind,index:s.index}
  function update(changes:Partial<State>){setState(old=>normalize({...old,...changes}))}
  const percent=(v:number)=>(100*v).toFixed(1)+'%'
  const select=(x:MoeSelection)=>update({kind:x.kind,index:x.index})
  const go=(step:number)=>update({step})
  const options=(values:number[])=>values.map(value=>({value,label:String(value)}))

  return <ExperimentShell labId="moe-routing" step={s.step} maxStep={30} onStepChange={go} getShareUrl={getShareUrl}
    onReset={()=>setState(presetState(s.preset))} presets={MOE_PRESETS.map(p=>({id:p.id,label:t.presets[p.id],active:p.id===s.preset,onSelect:()=>setState(presetState(p.id))}))}
    controls={<>
      <SliderControl label={t.numTokens} min={8} max={24} value={numTokens} onChange={value=>update({numTokens:value})}/>
      <SegmentedControl label={t.numExperts} value={numExperts} options={options(experts)} onChange={value=>update({numExperts:value})}/>
      <SegmentedControl label={t.topK} value={topK} options={options(ks)} onChange={value=>update({topK:value})}/>
      <SliderControl label={t.capacity} min={.75} max={2} step={.05} format={v=>v.toFixed(2)} value={capacityFactor} onChange={value=>update({capacityFactor:value})}/>
      <SegmentedControl label={t.mode} value={balancingMode} options={modes.map(value=>({value,label:t.modes[value]}))} onChange={value=>update({balancingMode:value})}/>
      <SliderControl label={t.alpha} min={0} max={.2} step={.01} format={v=>v.toFixed(2)} value={auxAlpha} onChange={value=>update({auxAlpha:value})}/>
      <SliderControl label={t.noise} min={0} max={.5} step={.01} format={v=>v.toFixed(2)} value={routerNoise} onChange={value=>update({routerNoise:value})}/>
    </>}
    formula={<FormulaBar tex={String.raw`\mathcal L_{\rm aux}=\alpha E\textstyle\sum_e f_eP_e=${f.auxLoss.toFixed(4)},\quad C_{\rm slots}=\left\lceil ${capacityFactor}\frac{${numTokens}\cdot${topK}}{${numExperts}}\right\rceil=${f.capacity}`}/>}
    challenges={[
      {id:'collapse',...t.missions.collapse,completed:balancingMode==='none' && s.step>=15 && f.maxExpertShare>=.45},
      {id:'no-drops',...t.missions['no-drops'],completed:balancingMode!=='none' && s.step>=10 && capacityFactor<=1.25 && f.droppedRate===0},
      {id:'sparse',...t.missions.sparse,completed:numExperts===8 && topK===2 && f.activeRatio===.25},
    ]}
    stage={<MoeStage result={result} step={s.step} selection={selection} onSelect={select} onStepChange={go}/>}
    metrics={[
      {label:t.dropped,value:percent(f.droppedRate),tone:f.droppedRate?'warn':'good',hint:t.routeHint},
      {label:t.fullyDropped,value:percent(f.fullyDroppedRate),hint:t.tokenHint},
      {label:t.cv,value:f.loadCV.toFixed(3),hint:t.loadHint},
      {label:t.aux,value:f.auxLoss.toFixed(4)},{label:t.active,value:percent(f.activeRatio),hint:t.activeHint},
    ]}
    inspector={<MoeInspector result={result} step={s.step} selection={selection}/>}
    explainer={<><p>{t.guides[balancingMode]}</p><p>{t.capacityGuide}</p></>}
  />
}
