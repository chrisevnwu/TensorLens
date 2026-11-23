import { expect,it } from 'vitest'
import { simulateCircuit } from '../circuits'
import { OPTIMIZER_PRESETS } from '../presets'

it.each(['neuron','attention','residual'] as const)('adds only the active edge contributions at every reverse step in the %s circuit',circuit=>{
  const {trace}=simulateCircuit({...OPTIMIZER_PRESETS[0],circuit})
  for(let step=1;step<trace.length;step++){
    const before=trace[step-1]!,after=trace[step]!
    const node=before[before.length-step]!
    const expected=new Map(before.map(n=>[n.id,n.grad]))
    node.parentIds.forEach((id,i)=>expected.set(id,expected.get(id)!+node.grad*node.localDerivatives[i]!))
    for(const item of after) expect(item.grad).toBeCloseTo(expected.get(item.id)!,12)
  }
})
