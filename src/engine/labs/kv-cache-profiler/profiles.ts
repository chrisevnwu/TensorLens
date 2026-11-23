export interface ModelProfile {
  id: string
  label: string
  /** Nominal parameter count in billions; memory estimates use decimal bytes. */
  paramsB: number
  layers: number
  qHeads: number
  kvHeads: number
  headDim: number
  hiddenSize?: number
  latentDim: number
  ropeDim: number
  weightBytes: number
}
export interface HardwareProfile {
  id: string
  label: string
  capacityGB: number
  peakTflops: number
  bandwidthTBs: number
}

// Published shapes: https://github.com/meta-llama/llama-models/blob/main/models/sku_list.py
// https://huggingface.co/Qwen/Qwen2.5-32B/blob/main/config.json
// https://huggingface.co/deepseek-ai/DeepSeek-V3/blob/main/config.json
// Dense models can be switched to a hypothetical 512+64 latent cache for comparison.
// DeepSeek's actual MLA cache uses 512 latent + 64 positional entries per token/layer.
export const MODEL_PROFILES = [
  { id:'llama8', label:'Llama 3 8B', paramsB:8, layers:32, qHeads:32, kvHeads:8, headDim:128,
    latentDim:512, ropeDim:64, weightBytes:2 },
  { id:'qwen32', label:'Qwen2.5 32B', paramsB:32, layers:64, qHeads:40, kvHeads:8, headDim:128,
    latentDim:512, ropeDim:64, weightBytes:2 },
  { id:'llama70', label:'Llama 3 70B', paramsB:70, layers:80, qHeads:64, kvHeads:8, headDim:128,
    latentDim:512, ropeDim:64, weightBytes:2 },
  { id:'deepseek', label:'DeepSeek-V3 MLA', paramsB:671, layers:61, qHeads:128, kvHeads:128, headDim:128, hiddenSize:7168,
    latentDim:512, ropeDim:64, weightBytes:1 },
  { id:'custom', label:'Custom', paramsB:8, layers:32, qHeads:32, kvHeads:8, headDim:128,
    latentDim:512, ropeDim:64, weightBytes:2 },
] as const satisfies readonly ModelProfile[]

// These are the teaching profiles defined by LAB_SPECS.md, not measured throughput.
export const HARDWARE_PROFILES = [
  { id:'h100', label:'NVIDIA H100 SXM', capacityGB:80, peakTflops:989, bandwidthTBs:3.35 },
  { id:'a100', label:'NVIDIA A100 80GB', capacityGB:80, peakTflops:312, bandwidthTBs:2 },
  { id:'rtx4090', label:'NVIDIA RTX 4090', capacityGB:24, peakTflops:165, bandwidthTBs:1 },
  { id:'m4max', label:'Apple M4 Max 128GB', capacityGB:128, peakTflops:54, bandwidthTBs:0.55 },
] as const satisfies readonly HardwareProfile[]
