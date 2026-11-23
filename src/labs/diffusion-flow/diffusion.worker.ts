import { simulateDiffusion, type DiffusionConfig } from '../../engine/labs/diffusion-flow/engine'

self.onmessage=(event:MessageEvent<{config:DiffusionConfig;seed:number}>)=>{
  const {config,seed}=event.data
  self.postMessage(simulateDiffusion(config,seed))
}
