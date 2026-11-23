import { useEffect,useMemo } from 'react'
import { ExperimentShell } from '../../components/layout/ExperimentShell'
import { FormulaBar } from '../../components/viz/FormulaBar'
import { circuitStep,simulateCircuit,type CircuitKey } from '../../engine/labs/backprop-optimizers/circuits'
import { OPTIMIZER_PRESETS } from '../../engine/labs/backprop-optimizers/presets'
import { OPTIMIZERS,runRace } from '../../engine/labs/backprop-optimizers/race'
import { useI18n } from '../../i18n'
import { optimizerCopy } from '../../i18n/labs/backprop-optimizers'
import { ArenaControls } from './ArenaControls'
import { DagStage,DagInspector } from './DagStage'
import { RaceStage,RaceInspector } from './RaceStage'
import { presetState,useArenaState,type State } from './config'

const formulas={
  ravine:String.raw`f(x,y)=0.5x^2+12y^2`,rosenbrock:String.raw`f(x,y)=(1-x)^2+10(y-x^2)^2`,
  saddle:String.raw`f(x,y)=x^2-y^2+0.1(x^4+y^4)`,multimodal:String.raw`f(x,y)=\sin(2x)\cos(2y)+0.15(x^2+y^2)`,
}
const fmt=(v:number)=>String(Number(v.toPrecision(5)))

export default function OptimizerLab(){
  const {locale}=useI18n(),t=optimizerCopy[locale]
  const {state:s,setState,getShareUrl}=useArenaState(),race=s.mode==='race'
  const {landscape,startX,startY,learningRate,beta1,beta2,weightDecay,lrSchedule}=s
  const frames=useMemo(()=>runRace({landscape,startX,startY,learningRate,beta1,beta2,weightDecay,lrSchedule}),
    [landscape,startX,startY,learningRate,beta1,beta2,weightDecay,lrSchedule])
  const {circuit,activation,skipConnection,x1,x2,y,w1,w2,b,q1,q2,k1,k2}=s
  const graph=useMemo(()=>simulateCircuit({circuit,activation,skipConnection,x1,x2,y,w1,w2,b,q1,q2,k1,k2}),
    [circuit,activation,skipConnection,x1,x2,y,w1,w2,b,q1,q2,k1,k2])
  const maxGraph=graph.trace.length-1, graphStep=Math.min(s.graphStep,maxGraph)
  useEffect(()=>{if(s.graphStep!==graphStep)setState(old=>({...old,graphStep}))},[s.graphStep,graphStep,setState])
  const step=race?s.raceStep:graphStep
  const raceFrame=frames[s.raceStep]!, points=raceFrame.points
  const visible=OPTIMIZERS.filter(id=>s.visible.split(',').includes(id))
  const best=visible.map(id=>points[id]).filter(p=>!p.diverged).sort((a,b)=>a.loss-b.loss)[0]
  const diverged=visible.filter(id=>points[id].diverged)
  function update(changes:Partial<State>){setState(old=>({...old,...changes}))}
  const go=(value:number)=>race?update({raceStep:value}):update({graphStep:value,node:''})
  function optimize(){
    setState(old=>{
      const next=circuitStep(old,old.learningRate)
      let clipped=false
      for(const key of ['w1','w2','b','q1','q2','k1','k2'] as CircuitKey[]) {
        const bounded=Math.max(-32,Math.min(32,next[key]))
        clipped ||= bounded!==next[key]; next[key]=bounded
      }
      return {...next,graphStep:0,clipped}
    })
  }
  const graphTex=circuit==='neuron'?String.raw`L=(\operatorname{${activation==='relu'?'ReLU':'GELU'}}(w_1x_1+w_2x_2+b)-y)^2`:
    circuit==='attention'?String.raw`L=-\log\sigma\!\left(\frac{q_1k_1+q_2k_2}{\sqrt{2}}\right)`:
      String.raw`L=(\tanh(w_2\tanh(w_1x))${skipConnection?'+x':''}-y)^2`
  const escaped=visible.some(id=>id!=='sgd' && !points[id].diverged && Math.hypot(points[id].x-startX,points[id].y-startY)>.25 && points[id].loss<frames[0]!.points[id].loss)
  return <ExperimentShell labId="backprop-optimizers" step={step} maxStep={race?100:maxGraph} onStepChange={go} intervalMs={race?140:500}
    getShareUrl={getShareUrl} onReset={()=>setState(presetState(s.preset))}
    presets={OPTIMIZER_PRESETS.map(p=>({id:p.id,label:t.presets[p.id],active:s.preset===p.id,onSelect:()=>setState(presetState(p.id))}))}
    controls={<ArenaControls s={s} result={graph} visible={visible} update={update} optimize={optimize}/>}
    formula={<FormulaBar tex={race?formulas[landscape]:graphTex}/>}
    challenges={[
      {id:'race',...t.missions.race,completed:race && landscape==='ravine' && visible.includes('adam') && visible.includes('sgd') && s.raceStep>=40 &&
        !points.adam.diverged && (points.sgd.diverged?points.adam.loss<.1*frames[0]!.points.adam.loss:points.adam.loss<.1*points.sgd.loss)},
      {id:'dead',...t.missions.dead,completed:!race && circuit==='neuron' && activation==='relu' && graph.preActivation!==null && graph.preActivation<0 &&
        graph.checks.filter(check=>check.trainable).every(check=>check.analytical===0)},
      {id:'saddle',...t.missions.saddle,completed:race && landscape==='saddle' && s.clicked && Math.hypot(startX-.05,startY-.02)<.25 && s.raceStep>=30 && escaped},
    ]}
    stage={race?<><RaceStage frames={frames} step={s.raceStep} landscape={landscape} visible={visible}
      onStartChange={(startX,startY)=>update({startX,startY,clicked:true,raceStep:0})} onStepChange={go}/>
      {diverged.length>0&&<p role="status">{t.diverged} · {diverged.map(id=>t.names[id]).join(', ')}</p>}</>:
      <DagStage result={graph} step={graphStep} selectedId={s.node} onSelect={node=>update({node})}/>}
    metrics={race?[
      {label:t.metrics.loss,value:best?fmt(best.loss):'—',hint:best?undefined:t.none,tone:'accent'},
      {label:t.metrics.step,value:s.raceStep+'/100'},{label:t.metrics.rate,value:fmt(raceFrame.learningRate)},{label:t.metrics.gradient,value:best?fmt(best.gradNorm):'—'},
    ]:[
      {label:t.metrics.circuitLoss,value:fmt(graph.loss),tone:'accent'},{label:t.metrics.error,value:fmt(graph.maxGradError),hint:t.finite},
      {label:t.metrics.gradient,value:fmt(graph.gradientNorm)}, {label:t.metrics.step,value:graphStep+'/'+maxGraph},
    ]}
    inspector={race?<RaceInspector frames={frames} step={s.raceStep} visible={visible}/>:<DagInspector result={graph} step={graphStep} selectedId={s.node}/>}
    explainer={race?<p>{t.raceGuide}</p>:<><p>{t.graphGuide}</p><p>{t.finite}</p><p>{t.update}</p></>}
  />
}
