import { useEffect, useMemo } from 'react'
import { SegmentedControl, SliderControl, ToggleControl } from '../../components/controls'
import { ExperimentShell } from '../../components/layout/ExperimentShell'
import { booleanField, choiceField, makeUrlCodec, numberField, useLabUrlState, type UrlStateCodec } from '../../components/utils/useLabUrlState'
import { FormulaBar } from '../../components/viz/FormulaBar'
import { simulateFlash, type FlashConfig } from '../../engine/labs/flash-attention/engine'
import { scalingCurve, tiledBytes } from '../../engine/labs/flash-attention/io'
import { FLASH_PRESETS, type FlashPresetId } from '../../engine/labs/flash-attention/presets'
import { useI18n } from '../../i18n'
import { flashCopy } from '../../i18n/labs/flash-attention'
import { FlashStage, FlashInspector } from './FlashStage'

interface State extends FlashConfig {preset:FlashPresetId; sramKB:number; step:number; sawNarrow:boolean}
const lengths=[8,12,16], blocks=[2,4,8]
function normalize(s:State):State {
  const available=blocks.filter(b=>s.seqLen%b===0)
  const blockBr=available.includes(s.blockBr)?s.blockBr:available.at(-1)!
  const blockBc=available.includes(s.blockBc)?s.blockBc:available.at(-1)!
  return {...s,blockBr,blockBc,sawNarrow:s.sawNarrow||blockBr===2}
}
function presetState(id:FlashPresetId):State {
  const {id:preset,...config}=FLASH_PRESETS.find(p=>p.id===id) ?? FLASH_PRESETS[0]
  return normalize({...config,preset,step:0,sawNarrow:false})
}
const initial=presetState('small')
const fields=makeUrlCodec<State>({
  preset:choiceField(FLASH_PRESETS.map(p=>p.id)),seqLen:choiceField(lengths),blockBr:choiceField(blocks),blockBc:choiceField(blocks),
  causalMask:booleanField,sramKB:numberField(64,256,1),step:numberField(0,256,1),sawNarrow:booleanField,
})
const codec:UrlStateCodec<State>={
  encode:fields.encode,
  decode(params){
    const preset=FLASH_PRESETS.find(p=>p.id===params.get('preset')) ?? FLASH_PRESETS[0]
    return normalize(fields.decode(params,presetState(preset.id)))
  },
}
const equations={
  'load-q':String.raw`m_i=-\infty,\quad l_i=0,\quad O_i=0`,
  'load-kv':String.raw`K_j,V_j\in\mathbb{R}^{B_c\times d}`,
  compute:String.raw`\alpha_i=e^{m_i-m_i'},\quad l_i'=\alpha_i l_i+\textstyle\sum_j P_{ij}`,
  skip:String.raw`\max(i)<\min(j)\;\Longrightarrow\;P_{ij}=0`,
  write:String.raw`O_i^{\mathrm{final}}=O_i/l_i`,
}

export default function FlashLab() {
  const {locale}=useI18n()
  const t=flashCopy[locale]
  const {state:s,setState,getShareUrl}=useLabUrlState(initial,codec)
  const {seqLen,blockBr,blockBc,causalMask,sramKB}=s
  const config=useMemo(()=>({seqLen,blockBr,blockBc,causalMask}),[seqLen,blockBr,blockBc,causalMask])
  const result=useMemo(()=>simulateFlash(config),[config])
  const scaling=useMemo(()=>scalingCurve(sramKB,causalMask),[sramKB,causalMask])
  const last=result.trace.length-1, step=Math.min(last,s.step), frame=result.trace[step]!
  useEffect(()=>{if (s.step!==step) setState(old=>({...old,step}))},[s.step,step,setState])
  const baseline=tiledBytes(seqLen,result.Q.cols,2,blockBc,causalMask)
  const options=blocks.filter(b=>seqLen%b===0).map(value=>({value,label:String(value)}))

  function configure(changes:Partial<FlashConfig>) {
    setState(old=>{
      const next={...old,...changes,step:0}
      const comparable=next.seqLen===old.seqLen && next.blockBc===old.blockBc && next.causalMask===old.causalMask
      return normalize({...next,sawNarrow:comparable && old.sawNarrow})
    })
  }
  const go=(value:number)=>setState(old=>({...old,step:value}))
  return <ExperimentShell labId="flash-attention" step={step} maxStep={last} onStepChange={go} intervalMs={320}
    onReset={()=>setState(presetState(s.preset))} getShareUrl={getShareUrl}
    presets={FLASH_PRESETS.map(p=>({id:p.id,label:t.presets[p.id],active:p.id===s.preset,onSelect:()=>setState(presetState(p.id))}))}
    controls={<>
      <SegmentedControl label={t.seq} value={seqLen} options={lengths.map(value=>({value,label:String(value)}))} onChange={value=>configure({seqLen:value})} />
      <SegmentedControl label={t.br} value={blockBr} options={options} onChange={value=>configure({blockBr:value})} />
      <SegmentedControl label={t.bc} value={blockBc} options={options} onChange={value=>configure({blockBc:value})} />
      <ToggleControl label={t.causal} checked={causalMask} onChange={value=>configure({causalMask:value})} />
      <SliderControl label={t.sram} value={sramKB} min={64} max={256} onChange={value=>setState(old=>({...old,sramKB:value}))}/>
    </>}
    formula={<FormulaBar tex={equations[frame.phase]} />}
    challenges={[
      {id:'exact',...t.missions.exact,completed:step===last && result.maxAbsError<1e-10},
      {id:'skipping',...t.missions.skipping,completed:causalMask && seqLen===16 && blockBr===4 && blockBc===4 && frame.skippedTiles>=6},
      {id:'tiles',...t.missions.tiles,completed:s.sawNarrow && blockBr===8 && result.flashBytes<baseline},
    ]}
    stage={<FlashStage result={result} step={step} config={config} scaling={scaling} onStepChange={go} />}
    metrics={[
      {label:t.flash,value:result.flashBytes+' B',hint:t.total,tone:'accent'},
      {label:t.standard,value:result.standardBytes+' B',hint:t.total},
      {label:t.speedup,value:(result.standardBytes/result.flashBytes).toFixed(2)+'×',hint:t.ratioHint},
      {label:t.error,value:result.maxAbsError<1e-12?'< 10⁻¹²':result.maxAbsError.toExponential(2),tone:'good',hint:t.measured+' · '+result.maxAbsError.toExponential(4)},
    ]}
    inspector={<FlashInspector result={result} step={step} />}
    explainer={<><strong>{t.phases[frame.phase]}</strong><p>{t.guides[frame.phase]}</p><p>{t.narrow.replace('{bytes}',String(baseline))}</p><p>{t.precision}</p></>}
  />
}
