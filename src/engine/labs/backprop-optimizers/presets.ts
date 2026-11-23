const base={
  mode:'race',landscape:'ravine',startX:2,startY:1.5,learningRate:.1,beta1:.9,beta2:.999,weightDecay:.01,lrSchedule:'constant',
  circuit:'neuron',activation:'relu',skipConnection:true,x1:.8,x2:-.4,y:.5,w1:1.2,w2:-.7,b:.2,q1:.8,q2:-.2,k1:.6,k2:.5,
} as const
export const OPTIMIZER_PRESETS=[
  {...base,id:'ravine'},
  {...base,id:'saddle',landscape:'saddle',startX:.05,startY:.02,learningRate:.05},
  {...base,id:'dead',mode:'graph',circuit:'neuron',activation:'relu',b:-2},
  {...base,id:'warmup',lrSchedule:'warmup-cosine'},
] as const
export type OptimizerPresetId=typeof OPTIMIZER_PRESETS[number]['id']
