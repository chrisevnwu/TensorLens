import { SegmentedControl, SelectControl, SliderControl } from '../../components/controls'
import { ExperimentShell } from '../../components/layout/ExperimentShell'
import { useLabUrlState } from '../../components/utils/useLabUrlState'
import { FormulaBar } from '../../components/viz/FormulaBar'
import { computeProfile } from '../../engine/labs/kv-cache-profiler/engine'
import { HARDWARE_PROFILES, MODEL_PROFILES } from '../../engine/labs/kv-cache-profiler/profiles'
import { buildDecodeTrace } from '../../engine/labs/kv-cache-profiler/trace'
import { useI18n } from '../../i18n'
import { kvCopy } from '../../i18n/labs/kv-cache-profiler'
import { attentionTypes, codec, initial, modes, normalize, precisions, scenario, scenarios, selectedModel, type KvState } from './config'
import { CustomControls } from './CustomControls'
import { KvInspector, KvStage } from './KvStage'
import './custom.css'

const trace=buildDecodeTrace()

export default function KvLab() {
  const {locale}=useI18n()
  const t=kvCopy[locale]
  const {state:s,setState,getShareUrl}=useLabUrlState(initial,codec)
  const model=selectedModel(s)
  const hardware=HARDWARE_PROFILES.find(p=>p.id===s.hardwareId) ?? HARDWARE_PROFILES[0]
  const result=computeProfile({model,hardware,attentionType:s.attentionType,kvPrecision:s.kvPrecision,contextLength:s.contextLength,batchSize:s.batchSize})
  const frame=trace[s.step]!
  function update(change:Partial<KvState>) {setState(previous=>normalize({...previous,...change}))}
  const speedHint=t.aggregate.replace('{speed}',result.perSequenceTokensPerSecond.toFixed(1)).replace('{latency}',result.tpotMs.toFixed(2))
  const kvFormula=s.attentionType==='MLA' ? String.raw`M_{\rm KV}=L(d_c+d_r)BS\,b_{\rm KV}`
    : String.raw`M_{\rm KV}=2L H_{\rm KV}d_{\rm head}BS\,b_{\rm KV}`

  return <ExperimentShell labId="kv-cache-profiler" step={s.step} maxStep={trace.length-1} onStepChange={step=>update({step})}
    onReset={()=>setState(scenario(s.preset))} getShareUrl={getShareUrl}
    presets={scenarios.map(id=>({id,label:t.presets[id],active:s.preset===id,onSelect:()=>setState(scenario(id))}))}
    controls={<>
      <SegmentedControl label={t.mode} value={s.mode} options={modes.map(value=>({value,label:t.modes[value]}))}
        onChange={mode=>update({mode})} />
      <SelectControl label={t.model} value={s.modelId} options={MODEL_PROFILES.map(p=>({value:p.id,label:p.id==='custom'?t.custom:p.label}))}
        onChange={modelId=>update({modelId,attentionType:modelId==='deepseek'?'MLA':modelId==='custom'?s.attentionType:'GQA'})} />
      {s.modelId==='custom' && <CustomControls state={s} update={update} />}
      <SelectControl label={t.hardware} value={s.hardwareId} options={HARDWARE_PROFILES.map(p=>({value:p.id,label:p.label}))}
        onChange={hardwareId=>update({hardwareId})} />
      <SegmentedControl label={t.attention} value={s.attentionType} options={attentionTypes.map(value=>({value,label:value}))} onChange={attentionType=>update({attentionType})} />
      <SliderControl label={t.context} value={Math.log2(s.contextLength)} min={9} max={17} step={.125}
        format={()=>s.contextLength.toLocaleString(locale)} onChange={e=>update({contextLength:Math.round(2**e)})}/>
      <SliderControl label={t.batch} value={s.batchSize} min={1} max={64} onChange={batchSize=>update({batchSize})} />
      <SegmentedControl label={t.precision} value={s.kvPrecision} options={precisions.map(value=>({value,label:value}))}
        onChange={kvPrecision=>update({kvPrecision})} />
    </>}
    formula={<FormulaBar tex={kvFormula+String.raw`=${(result.kvBytes/1e9).toFixed(3)}\,\mathrm{GB}`} />}
    challenges={[
      {id:'oom',...t.missions.oom,completed:s.attentionType==='MHA' && s.kvPrecision==='FP16' && result.isOom},
      {id:'rescue',...t.missions.rescue,completed:['GQA','MLA'].includes(s.attentionType) && s.kvPrecision!=='FP16' && result.kvSavingsRatio>=.75},
      {id:'roofline',...t.missions.roofline,completed:s.batchSize>=32 && result.decodeAI>=10*result.singleBatchDecodeAI},
    ]}
    stage={<KvStage result={result} hardware={hardware} frame={frame} mode={s.mode}
      probeAI={s.probeAI} onProbeChange={probeAI=>update({probeAI})} />}
    metrics={[
      {label:t.cache,value:(result.kvBytes/1e9).toFixed(3),tone:result.isOom?'danger':'accent'},
      {label:t.speed,value:result.tokensPerSecond.toFixed(1),hint:speedHint},
      {label:t.ttft,value:result.ttftMs.toFixed(2),hint:t.ttftHint},
      {label:t.bound,value:t.regimes[result.decode.bound]},
    ]}
    inspector={<KvInspector result={result} frame={frame} />}
    explainer={<><p>{t.toyGuide}</p><p>{t.analyticGuide}</p>{result.isOom && <p>{t.noFit}</p>}
      {s.modelId==='deepseek' && <p>{t.deepseek}</p>}{s.hardwareId==='m4max' && <p>{t.apple}</p>}</>}
  />
}
