import {expect,it} from 'vitest'
import { circuitStep,simulateCircuit,type CircuitConfig } from '../circuits'
import { OPTIMIZER_PRESETS } from '../presets'

const baseline:CircuitConfig=OPTIMIZER_PRESETS[0]
function oracle(s:CircuitConfig) {
  if(s.circuit==='attention') {
    const z=(s.q1*s.k1+s.q2*s.k2)/Math.SQRT2
    return Math.log1p(Math.exp(-z))
  }
  if(s.circuit==='residual'){
    return (Math.tanh(s.w2*Math.tanh(s.w1*s.x1))+(s.skipConnection?s.x1:0)-s.y)**2
  }
  const u=s.w1*s.x1+s.w2*s.x2+s.b
  const act=s.activation==='relu'?Math.max(0,u):.5*u*(1+Math.tanh(Math.sqrt(2/Math.PI)*(u+.044715*u**3)))
  return (act-s.y)**2
}

it.each([
  {...baseline,circuit:'neuron',activation:'relu'}, {...baseline,circuit:'neuron',activation:'gelu'},
  {...baseline,circuit:'attention'}, {...baseline,circuit:'residual',skipConnection:true},
  {...baseline,circuit:'residual',skipConnection:false},
] as CircuitConfig[])('matches independent $circuit forward and every leaf gradient (skip=$skipConnection, act=$activation)',s=>{
  const r=simulateCircuit(s)
  expect(r.loss).toBeCloseTo(oracle(s),12)
  expect(r.maxGradError).toBeLessThan(1e-5)
  for(const check of r.checks) {
    const h=1e-5,value=s[check.key]
    const expected=(oracle({...s,[check.key]:value+h})-oracle({...s,[check.key]:value-h}))/(2*h)
    expect(Math.abs(check.analytical-expected)).toBeLessThan(1e-5)
    expect(check.numerical).toBeCloseTo(expected,8)
    expect(check.kink).toBe(false)
    const final=r.trace.at(-1)!.find(node=>node.id===check.nodeId)
    expect(final?.grad).toBe(check.analytical)
    expect(final?.op).toBe(check.trainable?'param':'input')
  }
  expect(r.trace).toHaveLength(r.trace[0]!.length+1)
  const initial=r.trace[0]!,lossNode=initial.at(-1)!
  expect(lossNode.grad).toBe(1)
  expect(initial.slice(0,-1).every(n=>n.grad===0)).toBe(true)
  expect(initial.every(n=>n.parentIds.length===n.localDerivatives.length)).toBe(true)
})

it.each(['neuron','attention','residual'] as const)('applies one measured SGD step to trainable %s slots only',circuit=>{
  const s={...baseline,circuit},r=simulateCircuit(s)
  const next=circuitStep(s,.01)
  const keys=r.checks.filter(ch=>ch.trainable).map(ch=>ch.key)
  expect(keys.length).toBeGreaterThan(0)
  for (const [key,value] of Object.entries(s)) {
    const check=r.checks.find(c=>c.key===key && c.trainable)
    if(check) expect(next[check.key]).toBeCloseTo(s[check.key]-.01*check.analytical,12)
    else expect(next[key as keyof CircuitConfig]).toBe(value)
  }
  expect(simulateCircuit(next).loss).toBeLessThan(r.loss)
})

it('distinguishes a dead ReLU from its exact nondifferentiable boundary',()=>{
  const dead=simulateCircuit(OPTIMIZER_PRESETS[2])
  expect(dead.preActivation).toBeLessThan(0)
  for(const check of dead.checks.filter(c=>c.trainable)) {
    expect(Math.abs(check.analytical)).toBe(0);expect(Math.abs(check.numerical)).toBe(0)
  }
  const s={...baseline,x1:1,x2:0,w1:1,w2:0,b:-1,y:1}
  const kink=simulateCircuit(s)
  const b=kink.checks.find(c=>c.key==='b')!
  expect(kink.preActivation).toBe(0)
  expect(b.kink).toBe(true)
  expect(Math.abs(b.analytical)).toBe(0)
  expect(b.numerical).toBeCloseTo(-1,4)
  expect(kink.checks.find(c=>c.key==='y')?.kink).toBe(false)
})

it('preserves the skip derivative even with a saturated inner tanh',()=>{
  const s={...baseline,circuit:'residual' as const,x1:2,w1:10,w2:.6,y:0}
  const grad=(skipConnection:boolean)=>simulateCircuit({...s,skipConnection}).checks.find(c=>c.key==='x1')!.analytical
  expect(Math.abs(grad(false))).toBeLessThan(1e-8)
  expect(grad(true)).toBeGreaterThan(1)
})
