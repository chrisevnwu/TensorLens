export const FLASH_PRESETS = [
  {id:'small', seqLen:8, blockBr:4, blockBc:4, causalMask:false, sramKB:128},
  {id:'fine', seqLen:12, blockBr:2, blockBc:2, causalMask:false, sramKB:64},
  {id:'causal', seqLen:16, blockBr:4, blockBc:4, causalMask:true, sramKB:228},
] as const

export type FlashPresetId = typeof FLASH_PRESETS[number]['id']
