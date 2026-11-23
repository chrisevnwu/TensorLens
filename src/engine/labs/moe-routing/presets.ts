export const MOE_PRESETS = [
  {id:'balanced',numTokens:16,numExperts:6,topK:2,capacityFactor:1.25,balancingMode:'aux-loss',auxAlpha:.05,routerNoise:.05},
  {id:'collapse',numTokens:16,numExperts:6,topK:1,capacityFactor:1.25,balancingMode:'none',auxAlpha:.05,routerNoise:.05},
  {id:'tight',numTokens:16,numExperts:6,topK:2,capacityFactor:1,balancingMode:'none',auxAlpha:.05,routerNoise:.05},
  {id:'lossfree',numTokens:16,numExperts:6,topK:2,capacityFactor:1.25,balancingMode:'loss-free-bias',auxAlpha:.05,routerNoise:.05},
] as const
export type MoePresetId = typeof MOE_PRESETS[number]['id']
