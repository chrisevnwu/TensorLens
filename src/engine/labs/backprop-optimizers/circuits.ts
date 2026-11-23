import { Value,type AutogradNodeSnapshot } from '../../math/autograd'

export type CircuitType='neuron'|'attention'|'residual'
export type CircuitActivation='relu'|'gelu'
export type CircuitKey='x1'|'x2'|'y'|'w1'|'w2'|'b'|'q1'|'q2'|'k1'|'k2'
export interface CircuitConfig extends Record<CircuitKey,number> {
  circuit:CircuitType
  activation:CircuitActivation
  skipConnection:boolean
}
export interface GradientCheck {
  key:CircuitKey; label:string; nodeId:string; trainable:boolean
  analytical:number; numerical:number; error:number; kink:boolean
}
export interface CircuitResult {
  trace:AutogradNodeSnapshot[][]
  loss:number
  preActivation:number|null
  checks:GradientCheck[]
  maxGradError:number
  gradientNorm:number
}
export const circuitLabels:Record<CircuitKey,string>={
  x1:'x₁',x2:'x₂',y:'y',w1:'w₁',w2:'w₂',b:'b',q1:'q₁',q2:'q₂',k1:'k₁',k2:'k₂',
}

function build(s:CircuitConfig) {
  const leaves:{key:CircuitKey;node:Value;trainable:boolean}[]=[]
  const leaf=(key:CircuitKey,trainable=false)=>{
    const node=new Value(s[key],circuitLabels[key],trainable?'param':'input')
    leaves.push({key,node,trainable})
    return node
  }
  let loss:Value
  let preActivation:number|null=null
  if(s.circuit==='attention'){
    const a=leaf('q1',true).mul(leaf('k1',true),'q₁k₁')
    const b=leaf('q2',true).mul(leaf('k2',true),'q₂k₂')
    const score=a.add(b,'q·k').div(Math.SQRT2,'z')
    // Equivalent softplus(-z) form keeps very negative scores outside the guarded log domain.
    loss=score.value < -20 ? score.mul(-1,'−z').add(score.exp().add(1).log(),'L') :
      score.sigmoid('σ(z)').log('log σ').mul(-1,'L')
  } else if(s.circuit==='residual'){
    const x=leaf('x1'),inner=leaf('w1',true).mul(x,'w₁x').tanh('h')
    const out=leaf('w2',true).mul(inner,'w₂h').tanh('a')
    const prediction=s.skipConnection?out.add(x,'ŷ'):out
    loss=prediction.sub(leaf('y'),'e').pow(2,'L')
  } else {
    const left=leaf('w1',true).mul(leaf('x1'),'w₁x₁'),right=leaf('w2',true).mul(leaf('x2'),'w₂x₂')
    const z=left.add(right).add(leaf('b',true),'z')
    preActivation=z.value
    const prediction=s.activation==='relu'?z.relu('ŷ'):z.gelu('ŷ')
    loss=prediction.sub(leaf('y'),'e').pow(2,'L')
  }
  return {loss,preActivation,leaves}
}

export function simulateCircuit(s:CircuitConfig):CircuitResult {
  const {loss,preActivation,leaves}=build(s)
  const trace=loss.backwardTrace(), h=1e-5
  const checks=leaves.map(({node,key,trainable})=>{
    const hi=build({...s,[key]:s[key]+h}),lo=build({...s,[key]:s[key]-h})
    const numerical=(hi.loss.value-lo.loss.value)/(2*h)
    const kink=s.circuit==='neuron' && s.activation==='relu' && hi.preActivation!==lo.preActivation &&
      Math.min(hi.preActivation!,lo.preActivation!)<=0 && Math.max(hi.preActivation!,lo.preActivation!)>=0
    return {key,nodeId:node.id,label:node.label,trainable,analytical:node.grad,numerical,error:Math.abs(node.grad-numerical),kink}
  })
  return {trace,checks,loss:loss.value,preActivation,
    maxGradError:Math.max(0,...checks.filter(check=>!check.kink).map(check=>check.error)),
    gradientNorm:Math.hypot(...checks.filter(check=>check.trainable).map(check=>check.analytical)),
  }
}

export function circuitStep<T extends CircuitConfig>(s:T,learningRate:number):T {
  if(!Number.isFinite(learningRate)||learningRate<0) throw new RangeError('Learning rate must be finite and nonnegative')
  const {loss,leaves}=build(s)
  loss.backward()
  const next={...s}
  for(const {key,node,trainable} of leaves) if(trainable) next[key]=s[key]-learningRate*node.grad
  return next
}
