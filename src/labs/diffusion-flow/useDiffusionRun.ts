import { useEffect,useMemo,useState } from 'react'
import { simulateDiffusion,type DiffusionConfig,type DiffusionResult } from '../../engine/labs/diffusion-flow/engine'

interface Request {config:DiffusionConfig;seed:number}
interface Response {request:Request;result:DiffusionResult|null;error:boolean}

/** Only structural settings launch a run. Moving the playhead reads existing numerical frames. */
export function useDiffusionRun(config:DiffusionConfig,seed=42) {
  const {dataset,sampler,numSteps,schedule,targetClass,cfgScale}=config
  const request=useMemo(()=>({config:{dataset,sampler,numSteps,schedule,targetClass,cfgScale},seed}),
    [dataset,sampler,numSteps,schedule,targetClass,cfgScale,seed])
  const [response,setResponse]=useState<Response|null>(null)
  useEffect(()=>{
    let current=true, worker:Worker|undefined
    const publish=(result:DiffusionResult|null,error:boolean)=>{
      if(current)setResponse({request,result,error})
      worker?.terminate()
    }
    function runHere() {
      if(!current)return
      try{publish(simulateDiffusion(request.config,request.seed),false)}
      catch{publish(null,true)}
    }
    if(typeof Worker==='undefined') runHere()
    else {
      try{
        worker=new Worker(new URL('./diffusion.worker.ts',import.meta.url),{type:'module'})
        worker.onmessage=(e:MessageEvent<DiffusionResult>)=>publish(e.data,false)
        worker.onerror=e=>{e.preventDefault();runHere()}
        worker.postMessage(request)
      }catch{runHere()}
    }
    return ()=>{current=false;worker?.terminate()}
  },[request])
  return {result:response?.result??null,resolvedConfig:response?.request.config??null,
    busy:response?.request!==request,error:response?.request===request&&response.error}
}
