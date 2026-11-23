import { act,renderHook } from '@testing-library/react'
import { afterEach,expect,it,vi } from 'vitest'
import { useDiffusionRun } from './useDiffusionRun'
import type { DiffusionConfig,DiffusionResult } from '../../engine/labs/diffusion-flow/engine'

const config:DiffusionConfig={dataset:'moons',sampler:'ddim',numSteps:5,schedule:'cosine',targetClass:'all',cfgScale:0}
const result:DiffusionResult={target:[],runs:{}}
afterEach(()=>vi.unstubAllGlobals())
it('keeps superseded or unmounted workers from replacing the current run',()=>{
  const workers:TestWorker[]=[]
  class TestWorker {
    onmessage?: (e:{data:DiffusionResult})=>void
    postMessage=vi.fn()
    terminate=vi.fn()
    constructor(){workers.push(this)}
  }
  vi.stubGlobal('Worker',TestWorker)
  const hook=renderHook(({settings})=>useDiffusionRun(settings),{initialProps:{settings:config}})
  expect(hook.result.current.busy).toBe(true)
  const next={...config,cfgScale:2}
  hook.rerender({settings:next})
  expect(workers).toHaveLength(2)
  expect(workers[0]!.terminate).toHaveBeenCalled()
  act(()=>workers[0]!.onmessage!({data:result}))
  expect(hook.result.current.result).toBeNull()
  act(()=>workers[1]!.onmessage!({data:result}))
  expect(hook.result.current.busy).toBe(false)
  expect(hook.result.current.resolvedConfig).toEqual(next)
  hook.rerender({settings:{...next}})
  expect(workers).toHaveLength(2)
  hook.unmount()
  expect(workers[1]!.terminate).toHaveBeenCalled()
})
