export const LORA_PRESETS=[
  {id:'intrinsic',rank:4,loraAlpha:8,zeroInitB:true,targetPreset:'low-rank',modelSizeB:7},
  {id:'stress',rank:2,loraAlpha:8,zeroInitB:true,targetPreset:'full-rank',modelSizeB:7},
  {id:'broken',rank:4,loraAlpha:8,zeroInitB:false,targetPreset:'low-rank',modelSizeB:7},
  {id:'budget',rank:8,loraAlpha:16,zeroInitB:true,targetPreset:'attention-shift',modelSizeB:70},
] as const
export type LoraPresetId=typeof LORA_PRESETS[number]['id']
