import { useMemo,useState } from 'react'
import { SegmentedControl,SelectControl,SliderControl,ToggleControl } from '../../components/controls'
import { ExperimentShell } from '../../components/layout/ExperimentShell'
import { useLabUrlState } from '../../components/utils/useLabUrlState'
import { FormulaBar } from '../../components/viz/FormulaBar'
import { bitRows,flipMaskBit,FLOAT_FORMATS,isExponentScalingFlip } from '../../engine/labs/quantization/bits'
import { simulateQuant } from '../../engine/labs/quantization/engine'
import { QUANT_PRESETS } from '../../engine/labs/quantization/presets'
import type { FloatFormat } from '../../engine/math/ieee754'
import { useI18n } from '../../i18n'
import { quantCopy } from '../../i18n/labs/quantization'
import { BitInspector,BitStage } from './BitStage'
import { QuantInspector,QuantStage } from './QuantStage'
import { clearMasks,codec,groups,initial,methods,modes,presetState,type State,validNumber } from './config'

const formatNames:Record<FloatFormat,string>={fp32:'FP32',fp16:'FP16',bf16:'BF16',fp8_e4m3:'FP8 E4M3',fp8_e5m2:'FP8 E5M2'}
function display(value:number) {
  if (Object.is(value,-0)) return '−0'
  if (value===Infinity) return '∞'
  if (value===-Infinity) return '−∞'
  return Number.isFinite(value)?String(Number(value.toPrecision(6))):'NaN'
}
export default function QuantLab(){
  const {locale}=useI18n()
  const t=quantCopy[locale]
  const {state:s,setState,getShareUrl}=useLabUrlState(initial,codec)
  const [draft,setDraft]=useState<string|null>(null)
  const {method,groupSize,outlierMag,smoothAlpha}=s
  const result=useMemo(()=>simulateQuant({method,groupSize,outlierMag,smoothAlpha}),[method,groupSize,outlierMag,smoothAlpha])
  const masks={fp32:s.fp32,fp16:s.fp16,bf16:s.bf16,fp8_e4m3:s.fp8_e4m3,fp8_e5m2:s.fp8_e5m2}
  const value=Number(s.value), tensor=s.mode==='tensor', grouped=method==='nf4'||method==='int4_group'
  const index=FLOAT_FORMATS.indexOf(s.format),active=bitRows(value,masks)[index]!
  const cell={row:s.row,col:s.col}
  function update(change:Partial<State>){setState(old=>({...old,...change}))}
  function flip(format:FloatFormat,bit:number){
    setState(old=>({...old,format,[format]:flipMaskBit(format,old[format],bit),
      exponentFlip:old.exponentFlip||isExponentScalingFlip(Number(old.value),format,old[format],bit)}))
  }
  function setValue(text:string) {
    setDraft(text)
    if (validNumber(text) && text.trim()!==s.value) update({...clearMasks,value:text.trim()})
  }
  const floating=method==='fp16'||method==='bf16'||method==='fp8_e4m3'
  const operand=smoothAlpha>0?'u':'x', reconstruction=smoothAlpha>0?'\\hat u':'\\hat x'
  const quantization=floating?String.raw`${reconstruction}=\mathrm{fl}(${operand})`:method==='nf4'?
    String.raw`q=\arg\min_i|${operand}/s-c_i|,\quad${reconstruction}=sc_q`:
    String.raw`q=\operatorname{clip}(\operatorname{round}(${operand}/s)+z),\quad${reconstruction}=(q-z)s`
  const tensorTex=smoothAlpha>0?String.raw`u=x/g_j,\quad ${quantization},\quad \hat x=g_j\hat u`:quantization
  const bitTex=active.isNaN ? String.raw`x=\mathrm{NaN}` : active.isInf ? String.raw`x=(-1)^{${active.signBit}}\infty`
    : active.isSubnormal || active.represented===0 ? String.raw`x=(-1)^{${active.signBit}}\,f\,2^{1-${active.exponentBias}}`
    : String.raw`x=(-1)^{${active.signBit}}\,(1+f)\,2^{e-${active.exponentBias}}`
  return <ExperimentShell labId="quantization" step={tensor?s.row:index} maxStep={tensor?15:4}
    onStepChange={n=>tensor?update({row:n}):update({format:FLOAT_FORMATS[n]!})}
    onReset={()=>{setDraft(null);setState(presetState(s.preset))}} getShareUrl={getShareUrl}
    presets={QUANT_PRESETS.map(p=>({id:p.id,label:t.presets[p.id],active:p.id===s.preset,onSelect:()=>{setDraft(null);setState(presetState(p.id))}}))}
    controls={<>
      <SegmentedControl label={t.mode} value={s.mode} options={modes.map(value=>({value,label:t.modes[value]}))} onChange={mode=>{setDraft(null);update({mode})}}/>
      {tensor?<>
        <SelectControl label={t.method} value={method} options={methods.map(value=>({value,label:t.methods[value]}))} onChange={method=>update({method})}/>
        {grouped&&<SegmentedControl label={t.group} value={groupSize} options={groups.map(value=>({value,label:String(value)}))} onChange={groupSize=>update({groupSize})}/>}
        <SliderControl label={t.outlier} min={0} max={25} value={outlierMag} onChange={outlierMag=>update({outlierMag})}/>
        <ToggleControl label={t.smooth} checked={smoothAlpha>0} onChange={on=>update({smoothAlpha:on ? .5 : 0})}/>
        <SliderControl label={t.alpha} min={0} max={1} step={.05} format={v=>v.toFixed(2)} value={smoothAlpha} onChange={smoothAlpha=>update({smoothAlpha})}/>
      </>:<>
        <label className="wb-control">{t.decimal}<input name="value" aria-label={t.decimal} type="text" inputMode="decimal" maxLength={64}
          value={draft??s.value} aria-invalid={draft!==null&&!validNumber(draft)} onChange={e=>setValue(e.target.value)}
          onBlur={()=>setDraft(null)} onKeyDown={e=>{if(e.key==='Enter')e.currentTarget.blur()}}/>
          <small>{draft!==null&&!validNumber(draft)?t.invalid:t.numberHint}</small></label>
        <SelectControl label={t.format} value={s.format} options={FLOAT_FORMATS.map(value=>({value,label:formatNames[value]}))} onChange={format=>update({format})}/>
      </>}
    </>}
    formula={<FormulaBar tex={tensor?tensorTex:bitTex}/>}
    challenges={[
      {id:'outlier',...t.missions.outlier,completed:tensor&&method==='int4_sym'&&outlierMag>=15&&result.sqnrDb<10},
      {id:'recovery',...t.missions.recovery,completed:tensor&&method==='nf4'&&outlierMag>=15&&groupSize<=32&&result.sqnrDb>=18&&result.cosineSimilarity>=.99},
      {id:'exponent',...t.missions.exponent,completed:s.exponentFlip},
    ]}
    stage={tensor?<QuantStage result={result} cell={cell} onSelectCell={next=>update(next)}/>:<BitStage value={value} masks={masks} activeFormat={s.format} onFlip={flip} onFormat={format=>update({format})}/>}
    metrics={tensor?[
      {label:t.sqnr,value:result.sqnrDb.toFixed(2),tone:'accent'}, {label:t.cosine,value:result.cosineSimilarity.toFixed(5)},
      {label:t.mse,value:display(result.mse)}, {label:t.maxError,value:display(result.maxAbsError)}, {label:t.bits,value:result.effectiveBits.toFixed(3)},
    ]:[
      {label:t.represented,value:display(active.represented),tone:'accent'},{label:t.absolute,value:display(active.absError)},
      {label:t.spacing,value:active.ulp===null?'—':display(active.ulp)}, {label:t.width,value:String(active.digits.length)},
    ]}
    inspector={tensor?<QuantInspector result={result} cell={cell}/>:<BitInspector value={value} masks={masks} activeFormat={s.format}/>}
    explainer={tensor?<><p>{t.guides.tensor}</p>{grouped&&<p>{t.guides.groups}</p>}{method==='nf4'&&<p>{t.guides.nf4}</p>}
      {floating&&<p>{t.guides.floating}</p>}{smoothAlpha>0&&<p>{t.guides.smooth}</p>}</>:<p>{t.guides.bits}</p>}
  />
}
