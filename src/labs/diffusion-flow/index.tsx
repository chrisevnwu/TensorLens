import {useEffect,useMemo} from 'react'
import {SegmentedControl,SliderControl,ToggleControl} from '../../components/controls'
import {ExperimentShell} from '../../components/layout/ExperimentShell'
import {FormulaBar} from '../../components/viz/FormulaBar'
import type {DiffusionConfig} from '../../engine/labs/diffusion-flow/engine'
import {DIFFUSION_PRESETS} from '../../engine/labs/diffusion-flow/presets'
import {useI18n} from '../../i18n'
import {diffusionCopy} from '../../i18n/labs/diffusion-flow'
import {CLASSES,DATASETS,SAMPLERS,SCHEDULES,STEPS,presetState,useDiffusionState} from './config'
import {DiffusionStage,DiffusionInspector} from './DiffusionStage'
import {NoiseChart} from './NoiseChart'
import {useDiffusionRun} from './useDiffusionRun'

const formulas={
  ddpm:String.raw`x_s=\tilde\mu(x_t,\hat x_0)+\sqrt{\tilde\beta_{t\to s}}\,z,\quad z\sim\mathcal N(0,I)`,
  ddim:String.raw`x_s=\sqrt{\bar\alpha_s}\,\hat x_0+\sqrt{1-\bar\alpha_s}\,\hat\epsilon_{\rm guided}`,
  flow:String.raw`v_t(x)=\frac{\sum_j w_j(t,x)y_j-x}{\max(1-t,0.02)}`,
  compare:String.raw`\rho=\frac{\sum_i\sum_k\lVert x_{k+1}^{(i)}-x_k^{(i)}\rVert}{\sum_i\lVert x_N^{(i)}-x_0^{(i)}\rVert}`,
}
export default function DiffusionLab(){
  const {locale}=useI18n(),t=diffusionCopy[locale]
  const {state:s,setState,getShareUrl}=useDiffusionState()
  const {dataset,sampler,numSteps,schedule,targetClass,cfgScale}=s
  const config=useMemo<DiffusionConfig>(()=>({dataset,sampler,numSteps,schedule,targetClass,cfgScale}),
    [dataset,sampler,numSteps,schedule,targetClass,cfgScale])
  const {result,busy,error}=useDiffusionRun(config)
  const ready=Boolean(result)&&!busy&&!error
  const step=s.step,lead=sampler==='compare'?'ddim':sampler
  const frame=ready?result?.runs[lead]?.[step]:undefined
  const fraction=frame?.progress
  const highNoise=s.showVectorField && fraction!==undefined && fraction<=.2
  useEffect(()=>{
    if(highNoise && !s.fieldStart)setState(old=>({...old,fieldStart:true}))
  },[highNoise,s.fieldStart,setState])
  function change<K extends keyof DiffusionConfig>(key:K,value:DiffusionConfig[K]){
    setState(old=>old[key]===value?old:{...old,[key]:value,step:0,fieldStart:false})
  }
  function go(next:number){setState(old=>({...old,step:Math.min(next,old.numSteps)}))}
  const distance=frame?.meanDistance.toFixed(4)??'—',straightness=frame?.straightness.toFixed(3)??'—'
  const purity=frame?(100*(targetClass==='b'?1-frame.purityA:frame.purityA)).toFixed(1)+'%':'—'
  const leadHint=sampler==='compare'?t.lead:t.samplers[lead]
  const finished=frame?.step===numSteps
  const flowFrame=result?.runs.flow?.[step],ddpmFrame=result?.runs.ddpm?.[step]
  const fieldSeen=s.fieldStart && s.showVectorField && fraction!==undefined && fraction>=.8
  return <ExperimentShell labId="diffusion-flow" exportReady={ready} step={step} maxStep={numSteps} onStepChange={go} intervalMs={340}
    getShareUrl={getShareUrl} onReset={()=>setState(presetState(s.preset))}
    presets={DIFFUSION_PRESETS.map(p=>({id:p.id,label:t.presets[p.id],active:s.preset===p.id,onSelect:()=>setState(presetState(p.id))}))}
    controls={<>
      <SegmentedControl label={t.dataset} value={dataset} options={DATASETS.map(value=>({value,label:t.datasets[value]}))} onChange={v=>change('dataset',v)}/>
      <SegmentedControl label={t.sampler} value={sampler} options={SAMPLERS.map(value=>({value,label:t.samplers[value]}))} onChange={v=>change('sampler',v)}/>
      <SliderControl label={t.numSteps} value={STEPS.indexOf(numSteps)} min={0} max={3}
        format={index=>String(STEPS[index])} onChange={index=>change('numSteps',STEPS[index]!)}/>
      <SegmentedControl label={t.schedule} value={schedule} options={SCHEDULES.map(value=>({value,label:t.schedules[value]}))} onChange={v=>change('schedule',v)}/>
      <SegmentedControl label={t.targetClass} value={targetClass} options={CLASSES.map(value=>({value,label:t.classes[value]}))} onChange={v=>change('targetClass',v)}/>
      <SliderControl label={t.cfgScale} value={cfgScale} min={0} max={5} step={.1} format={v=>v.toFixed(1)} onChange={v=>change('cfgScale',v)}/>
      <ToggleControl label={t.showVectorField} checked={s.showVectorField} onChange={showVectorField=>setState(old=>({...old,showVectorField}))}/>
      <ToggleControl label={t.showTrails} checked={s.showTrails} onChange={showTrails=>setState(old=>({...old,showTrails}))}/>
    </>}
    formula={<FormulaBar tex={formulas[sampler]}/>}
    challenges={[
      {id:'guidance',...t.missions.guidance,completed:finished && dataset==='moons' && targetClass==='a' && cfgScale>=2 && frame!==undefined && frame.purityA>=.90},
      {id:'straight',...t.missions.straight,completed:finished && sampler==='compare' && numSteps<=10 && !!flowFrame && !!ddpmFrame &&
        Math.abs(flowFrame.straightness-1)<Math.abs(ddpmFrame.straightness-1)},
      {id:'field',...t.missions.field,completed:fieldSeen},
    ]}
    stage={ready && result ? <>
      <DiffusionStage result={result} config={config} step={step} selected={s.particle}
        onSelect={particle=>setState(old=>({...old,particle}))} showVectorField={s.showVectorField} showTrails={s.showTrails}/>
      <NoiseChart schedule={schedule} step={step} numSteps={numSteps} onStepChange={go}/>
    </> : <p role="status">{error?t.error:t.busy}</p>}
    metrics={[
      {label:t.metrics.distance,value:distance,hint:leadHint,tone:'accent'},
      {label:t.metrics.straightness,value:straightness,hint:leadHint},
      {label:t.metrics.purity,value:purity,hint:targetClass==='b'?t.classBShare:t.classAShare},
      {label:t.metrics.step,value:step+'/'+numSteps,hint:(lead==='flow'?t.timeFlow:t.timeReverse)+' · t = '+(frame?.time.toFixed(2)??'—')},
    ]}
    inspector={ready && result?<DiffusionInspector result={result} config={config} step={step}/>:undefined}
    explainer={<><p>{t.guide}</p><p>{t.diffusion}</p><p>{t.flow}</p><p>{t.field}</p></>}/>
}
