export const QUANT_PRESETS = [
  {id:'clean',mode:'tensor',method:'int4_sym',groupSize:32,outlierMag:0,smoothAlpha:0,value:3.1415927},
  {id:'outlier',mode:'tensor',method:'int4_sym',groupSize:32,outlierMag:20,smoothAlpha:0,value:3.1415927},
  {id:'recovery',mode:'tensor',method:'nf4',groupSize:8,outlierMag:20,smoothAlpha:0,value:3.1415927},
  {id:'precision',mode:'bits',method:'bf16',groupSize:32,outlierMag:0,smoothAlpha:0,value:100000},
] as const
export type QuantPresetId=typeof QUANT_PRESETS[number]['id']
