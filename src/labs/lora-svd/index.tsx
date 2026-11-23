import { useMemo } from 'react'
import { SegmentedControl,SelectControl,SliderControl,ToggleControl } from '../../components/controls'
import { ExperimentShell } from '../../components/layout/ExperimentShell'
import { booleanField,choiceField,makeUrlCodec,numberField,useLabUrlState,type UrlStateCodec } from '../../components/utils/useLabUrlState'
import { FormulaBar } from '../../components/viz/FormulaBar'
import { simulateLora,type LoraConfig } from '../../engine/labs/lora-svd/engine'
import { memoryComparison,MODEL_SIZES,type ModelSize } from '../../engine/labs/lora-svd/memory'
import { LORA_PRESETS,type LoraPresetId } from '../../engine/labs/lora-svd/presets'
import { makeLoraTarget,type TargetPreset } from '../../engine/labs/lora-svd/targets'
import { useI18n } from '../../i18n'
import { loraCopy } from '../../i18n/labs/lora-svd'
import { LoraStage,LoraInspector } from './LoraStage'
import { MemoryChart } from './MemoryChart'

interface State extends LoraConfig {preset:LoraPresetId;modelSizeB:ModelSize;step:number;row:number;col:number}
const targets:TargetPreset[]=['low-rank','attention-shift','full-rank']
function presetState(id:LoraPresetId):State {
  const {id:preset,...config}=LORA_PRESETS.find(p=>p.id===id)??LORA_PRESETS[0]
  return {...config,preset,step:0,row:0,col:0}
}
const initial=presetState('intrinsic')
const fields=makeUrlCodec<State>({
  preset:choiceField(LORA_PRESETS.map(p=>p.id)),rank:numberField(1,16,1),loraAlpha:numberField(1,32,1),zeroInitB:booleanField,
  targetPreset:choiceField(targets),modelSizeB:choiceField(MODEL_SIZES),step:numberField(0,100,1),row:numberField(0,15,1),col:numberField(0,15,1),
})
const codec:UrlStateCodec<State>={
  encode:fields.encode,
  decode(params){const preset=LORA_PRESETS.find(p=>p.id===params.get('preset'))??LORA_PRESETS[0];return fields.decode(params,presetState(preset.id))},
}
function metric(x:number){return x===0?'0':x<.001?x.toExponential(4):x.toFixed(5)}

export default function LoraLab(){
  const {locale}=useI18n(),t=loraCopy[locale]
  const {state:s,setState,getShareUrl}=useLabUrlState(initial,codec)
  const {rank,loraAlpha,zeroInitB,targetPreset,modelSizeB}=s
  const target=useMemo(()=>makeLoraTarget(targetPreset),[targetPreset])
  const result=useMemo(()=>simulateLora({rank,loraAlpha,zeroInitB,targetPreset},42,target),[rank,loraAlpha,zeroInitB,targetPreset,target])
  const memory=useMemo(()=>memoryComparison(modelSizeB,rank),[modelSizeB,rank])
  const frame=result.frames[s.step]!,a=result.approximation,cell={row:s.row,col:s.col}
  function update(changes:Partial<State>){setState(old=>({...old,...changes}))}
  const go=(step:number)=>update({step})
  const rankChange=(rank:number)=>update({rank})
  return <ExperimentShell labId="lora-svd" step={s.step} maxStep={100} onStepChange={go} intervalMs={125}
    getShareUrl={getShareUrl} onReset={()=>setState(presetState(s.preset))}
    presets={LORA_PRESETS.map(p=>({id:p.id,label:t.presets[p.id],active:p.id===s.preset,onSelect:()=>setState(presetState(p.id))}))}
    controls={<>
      <SelectControl label={t.target} value={targetPreset} options={targets.map(value=>({value,label:t.targets[value]}))} onChange={targetPreset=>update({targetPreset})}/>
      <SliderControl label={t.rank} value={rank} min={1} max={16} onChange={rankChange}/>
      <SliderControl label={t.alpha} value={loraAlpha} min={1} max={32} onChange={loraAlpha=>update({loraAlpha})}/>
      <ToggleControl label={t.zero} checked={zeroInitB} onChange={zeroInitB=>update({zeroInitB})}/>
      <SegmentedControl label={t.model} value={modelSizeB} options={MODEL_SIZES.map(value=>({value,label:value+'B'}))} onChange={modelSizeB=>update({modelSizeB})}/>
    </>}
    formula={<FormulaBar tex={String.raw`W=W_0+\frac{${loraAlpha}}{${rank}}B_{16\times${rank}}A_{${rank}\times16},\quad E=\frac{\alpha}{r}BA-\Delta W`}/>}
    challenges={[
      {id:'energy',...t.missions.energy,completed:targetPreset==='low-rank' && rank<=4 && a.explainedEnergy>=.95},
      {id:'floor',...t.missions.floor,completed:s.step>=30 && frame.mse<=1.15*a.svdFloorMse+1e-4},
      {id:'failure',...t.missions.failure,completed:targetPreset==='full-rank' && rank===2 && a.explainedEnergy<.35},
    ]}
    stage={<><LoraStage result={result} step={s.step} cell={cell} onSelectCell={next=>update(next)} onStepChange={go} onRankChange={rankChange}/><MemoryChart memory={memory}/></>}
    metrics={[
      {label:t.trainable,value:(100*result.trainableFraction).toFixed(1)+'%',hint:t.paramsHint.replace('{adapter}',String(result.trainableParams)).replace('{total}',String(result.trainableParams+result.baseParams))},
      {label:t.energy,value:(100*a.explainedEnergy).toFixed(2)+'%',tone:'accent'},{label:t.mse,value:metric(frame.mse)},
      {label:t.floor,value:metric(a.svdFloorMse)},{label:t.savings,value:(100*memory.savings).toFixed(1)+'%',hint:t.savingsHint},
    ]}
    inspector={<LoraInspector result={result} step={s.step} cell={cell}/>}
    explainer={<><p>{t.fit}</p><p>{t.lineSearch}</p>{s.step===0&&<p>{t.zeroGuide}</p>}<p>{t.memoryGuide}</p></>}
  />
}
