function context(prompt:string,words:string[],logits:number[]) {
  const prior=prompt.match(/[\p{L}\p{N}_]+|[^\s]/gu) ?? []
  const counts=words.map(word=>prior.filter(token=>token===word).length)
  return {prompt,words,logits,counts}
}

// Curated next-token scores for three teaching contexts, before any filtering or normalization.
export const SAMPLE_CONTEXTS={
  factual:context('Question: What is the capital of France? The capital of France is',
    ['Paris','Lyon','Marseille','Nice','Bordeaux','Toulouse','Lille','the','a','London','Berlin','located','France','Strasbourg','known','in'],
    [7.5,3.9,3.6,3.25,3.1,2.8,2.5,2.35,2.2,2,1.85,1.65,1.4,1.2,.9,.6]),
  story:context('Beyond the moonlit gate, a traveler found a',
    ['garden','door','river','shadow','path','house','key','letter','voice','bird','map','lantern','moon','king','sword','gate'],
    [3.6,3.5,3.4,3.25,3,2.85,2.75,2.5,2.2,1.9,1.6,1.45,1.2,.9,.4,-.2]),
  code:context('for row in rows:\n    if row is not None:\n        ',
    ['result','yield','return','print','row','values','if','continue','pass','raise','for','None','rows','break','else','assert'],
    [4.7,4.4,4.3,4.05,3.9,3.2,2.8,2.6,2.3,1.8,1.1,.8,.55,.2,-.5,-1.1]),
}
export type SampleContextId=keyof typeof SAMPLE_CONTEXTS
const defaults={temperature:.8,topK:16,topP:.9,minP:0,repetitionPenalty:1,frequencyPenalty:0,presencePenalty:0,
  greedy:false,beamWidth:1,lengthPenalty:0} as const
export const SAMPLING_PRESETS=[
  {...defaults,id:'factual',context:'factual',mode:'sampling'},
  {...defaults,id:'story',context:'story',mode:'sampling'},
  {...defaults,id:'code',context:'code',mode:'sampling',topP:1,minP:.08},
  {...defaults,id:'trap',context:'factual',mode:'beam'},
] as const
export type SamplePresetId=typeof SAMPLING_PRESETS[number]['id']
