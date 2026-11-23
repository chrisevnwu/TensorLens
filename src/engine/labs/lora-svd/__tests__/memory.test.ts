import { expect,it } from 'vitest'
import { memoryComparison,MODEL_SIZES } from '../memory'

it.each(MODEL_SIZES)('counts every byte of BF16 full training for the %iB size class',size=>{
  const m=memoryComparison(size,4), f=m.rows[0]!
  const n=size*1e9
  expect(f.trainable).toBe(n)
  expect(f.baseBytes).toBe(2*n)
  expect(f.gradientBytes).toBe(2*n)
  expect(f.optimizerBytes).toBe(12*n)
  expect(f.adapterBytes).toBe(0)
  expect(f.activationBytes).toBe(4*2048*m.layers*m.hidden)
  expect(f.totalBytes).toBe(16*n+f.activationBytes)
})
it('counts two low-rank factors on each Q and V projection, without duplicating FP32 master weights',()=>{
  const m=memoryComparison(70,8)
  const [full,lora,qlora]=m.rows
  const adapters=m.layers*2*(m.hidden+m.hidden)*8
  expect(lora.trainable).toBe(adapters)
  expect(lora.adapterBytes).toBe(adapters*4)
  expect(lora.gradientBytes).toBe(adapters*4)
  expect(lora.optimizerBytes).toBe(adapters*8)
  expect(qlora.adapterBytes).toBe(adapters*2)
  expect(qlora.optimizerBytes).toBe(adapters*12)
  expect(qlora.baseBytes).toBe(70e9/2+Math.ceil(70e9/64)*2)
  for(const row of m.rows) expect(row.totalBytes).toBe(row.baseBytes+row.adapterBytes+row.gradientBytes+row.optimizerBytes+row.activationBytes)
  expect(m.savings).toBeCloseTo(1-qlora.totalBytes/full.totalBytes,14)
})
it('keeps model storage fixed and doubles adapter state when rank doubles',()=>{
  const a=memoryComparison(14,4).rows[1],b=memoryComparison(14,8).rows[1]
  expect(a.baseBytes).toBe(b.baseBytes)
  expect(b.adapterBytes).toBe(2*a.adapterBytes)
  expect(b.gradientBytes).toBe(2*a.gradientBytes)
  expect(b.optimizerBytes).toBe(2*a.optimizerBytes)
})
