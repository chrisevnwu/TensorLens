import { useEffect,useMemo } from 'react'
import { SegmentedControl,SliderControl,ToggleControl } from '../../components/controls'
import { ExperimentShell } from '../../components/layout/ExperimentShell'
import { useLabUrlState } from '../../components/utils/useLabUrlState'
import { FormulaBar } from '../../components/viz/FormulaBar'
import { simulateBeam } from '../../engine/labs/decoding-sampling/beam'
import { runSampling } from '../../engine/labs/decoding-sampling/engine'
import { sampleMonteCarlo } from '../../engine/labs/decoding-sampling/monte-carlo'
import { SAMPLE_CONTEXTS,SAMPLING_PRESETS } from '../../engine/labs/decoding-sampling/presets'
import { useI18n } from '../../i18n'
import { samplingCopy } from '../../i18n/labs/decoding-sampling'
import { BeamStage,BeamInspector } from './BeamStage'
import { SampleStage,SampleInspector } from './SampleStage'
import { codec,initial,maxDraws,modes,normalize,presetState,type State } from './config'

const equations=[
  String.raw`z'_i=r(z_i)-\lambda_f c_i-\lambda_p\mathbf{1}[c_i>0]`,
  String.raw`p_i=\mathrm{softmax}(z'_i/T)`,String.raw`i\in\mathrm{TopK}(p,K)`,
  String.raw`k^*=\min\{k:\textstyle\sum_{i=1}^k p_{(i)}\geq P\}`,String.raw`p_i\geq p_{\mathrm{min}}\max_j p_j`,
  String.raw`\tilde p_i=p_i/\textstyle\sum_{j\in S}p_j`,
]

export default function DecodingLab(){
  const {locale}=useI18n(), t=samplingCopy[locale]
  const {state:s,setState,getShareUrl}=useLabUrlState(initial,codec)
  const context=SAMPLE_CONTEXTS[s.context], sampling=s.mode==='sampling'
  const {custom,customLogits,temperature,greedy,topK,topP,minP,repetitionPenalty,frequencyPenalty,presencePenalty}=s
  const logits=useMemo(()=>custom?customLogits.split(',').map(Number):context.logits,[custom,customLogits,context])
  const result=useMemo(()=>runSampling({logits,counts:context.counts,temperature,greedy,topK,topP,minP,repetitionPenalty,frequencyPenalty,presencePenalty}),
    [logits,context,temperature,greedy,topK,topP,minP,repetitionPenalty,frequencyPenalty,presencePenalty])
  const samples=useMemo(()=>sampleMonteCarlo(result.probabilities,s.draws,s.seed),[result,s.draws,s.seed])
  const beam=useMemo(()=>simulateBeam(s.beamWidth,s.lengthPenalty),[s.beamWidth,s.lengthPenalty])
  const reference=useMemo(()=>simulateBeam(1,s.lengthPenalty),[s.lengthPenalty])
  const frame=beam.frames[Math.min(s.step,3)]!
  const node=beam.nodes[s.node]?.id ?? frame.bestId
  const best=beam.nodes[frame.bestId]!

  useEffect(()=>{if(!sampling && node!==s.node)setState(old=>({...old,node}))},[sampling,node,s.node,setState])
  function update(changes:Partial<State>){setState(old=>normalize({...old,...changes}))}
  function configure(changes:Partial<State>){update({...changes,draws:0})}
  function changeLogit(index:number,value:number){
    const next=[...logits]
    next[index]=Math.max(-12,Math.min(12,value))
    configure({custom:true,customLogits:next.join(','),selectedToken:index})
  }
  const go=(step:number)=>update({step,...(sampling?{}:{node:beam.frames[step]!.bestId})})
  const probability=(p:number)=>(100*p).toFixed(2)+'%'
  const beamEquation=String.raw`\mathrm{score}(y)=\frac{\sum_t\log p(y_t)}{((5+|y|)/6)^{${s.lengthPenalty.toFixed(2)}}}`
  return <ExperimentShell labId="decoding-sampling" step={s.step} maxStep={sampling?5:3} onStepChange={go}
    getShareUrl={getShareUrl} onReset={()=>setState(presetState(s.preset))}
    presets={SAMPLING_PRESETS.map(p=>({id:p.id,label:t.presets[p.id],active:s.preset===p.id,onSelect:()=>setState(presetState(p.id))}))}
    controls={<>
      <SegmentedControl label={t.mode} value={s.mode} options={modes.map(value=>({value,label:t.modes[value]}))} onChange={mode=>update({mode,step:0,node:0})}/>
      {sampling?<>
        <div className="wb-control"><strong>{t.context}</strong><pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{context.prompt}</pre></div>
        <ToggleControl label={t.custom} checked={custom} onChange={value=>configure({custom:value})}/>
        {custom&&<SliderControl label={t.raw+' · '+context.words[s.selectedToken]} min={-12} max={12} step={.1} value={logits[s.selectedToken]!} onChange={value=>changeLogit(s.selectedToken,value)}/>}
        <ToggleControl label={t.greedy} checked={greedy} onChange={value=>configure({greedy:value})}/>
        <SliderControl label={t.temperature} value={temperature} min={.05} max={2.5} step={.05} format={v=>v.toFixed(2)} onChange={value=>configure({temperature:value})}/>
        <SliderControl label={t.topK} value={topK} min={1} max={16} onChange={value=>configure({topK:value})}/>
        <SliderControl label={t.topP} value={topP} min={.1} max={1} step={.01} format={v=>v.toFixed(2)} onChange={value=>configure({topP:value})}/>
        <SliderControl label={t.minP} value={minP} min={0} max={.5} step={.01} format={v=>v.toFixed(2)} onChange={value=>configure({minP:value})}/>
        <SliderControl label={t.repetition} value={repetitionPenalty} min={1} max={2} step={.05} onChange={value=>configure({repetitionPenalty:value})}/>
        <SliderControl label={t.frequency} value={frequencyPenalty} min={-2} max={2} step={.05} onChange={value=>configure({frequencyPenalty:value})}/>
        <SliderControl label={t.presence} value={presencePenalty} min={-2} max={2} step={.05} onChange={value=>configure({presencePenalty:value})}/>
        <SliderControl label={t.seed} value={s.seed} min={0} max={65535} onChange={seed=>configure({seed})}/>
      </>:<>
        <SegmentedControl label={t.beamWidth} value={s.beamWidth} options={[1,2,3,4].map(value=>({value,label:String(value)}))} onChange={beamWidth=>update({beamWidth,node:simulateBeam(beamWidth,s.lengthPenalty).frames[s.step]!.bestId})}/>
        <SliderControl label={t.lengthPenalty} min={0} max={1.5} step={.05} value={s.lengthPenalty} onChange={lengthPenalty=>update({lengthPenalty})}/>
      </>}
    </>}
    formula={<>{sampling&&<h2>{t.steps[s.step]}</h2>}<FormulaBar tex={sampling?equations[s.step]!:beamEquation}/></>}
    challenges={[
      {id:'heat',...t.missions.heat,completed:sampling && s.context==='factual' && !custom && temperature>=1.8 && result.perplexity>=4},
      {id:'tail',...t.missions.tail,completed:sampling && s.context==='story' && !custom && minP>=.1 && topP===1 && topK===16 && result.statuses.includes('min-p') && result.statuses[result.order[1]!] ==='kept'},
      {id:'trap',...t.missions.trap,completed:!sampling && s.step===3 && s.seenGreedy && s.beamWidth>=2 && beam.best.score>reference.best.score},
    ]}
    stage={sampling?<SampleStage result={result} tokens={context.words} samples={samples} topP={topP} step={s.step} custom={custom} logits={logits}
      onLogitChange={changeLogit} selectedToken={s.selectedToken} onSelectToken={selectedToken=>update({selectedToken})}
      onSample={count=>setState(old=>({...old,step:5,draws:Math.min(maxDraws,old.draws+count)}))} onClear={()=>update({draws:0})}/>:
      <BeamStage result={beam} step={s.step} selectedId={node} onSelect={node=>update({node})}/>}
    metrics={sampling?[
      {label:t.count,value:String(result.survivors)},{label:t.entropy,value:result.entropyBits.toFixed(3)},{label:t.perplexity,value:result.perplexity.toFixed(3),tone:'accent'},{label:t.top1,value:probability(result.top1)},
    ]:[
      {label:t.depth,value:String(s.step)},{label:t.active,value:String(frame.activeIds.length)},{label:t.score,value:best.score.toFixed(3),tone:'accent'},{label:t.logProb,value:best.logProb.toFixed(3)},
    ]}
    inspector={sampling?<SampleInspector result={result} tokens={context.words} samples={samples} selectedToken={s.selectedToken} logits={logits} priorCounts={context.counts}/>:
      <BeamInspector result={beam} selectedId={node}/>}
    explainer={<p>{sampling?t.guide[s.step]:t.beamGuide}</p>}
  />
}
