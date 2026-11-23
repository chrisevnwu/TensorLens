import { expect, it } from 'vitest'
import { beamScore, simulateBeam, type Branch } from '../beam'

it('decides every width-one step from only the preceding local choice', () => {
  const {nodes,frames,best}=simulateBeam(1,0)
  let index=0
  for(const frame of frames.slice(1)){
    const choices=nodes[index]!.children.map(id=>nodes[id]!)
    const greedy=choices.reduce((a,b)=>a.probability>=b.probability?a:b)
    expect(frame.activeIds).toEqual([greedy.id])
    index=greedy.id
  }
  expect(best.id).toBe(index)
  expect(best.tokens).toEqual(['the','old','tree'])
})
it('escapes the trap for each wider beam, measured against an exhaustive joint-probability oracle', ()=>{
  const greedy=simulateBeam(1,0)
  const all=greedy.nodes.filter(node=>!node.children.length)
  const oracle=Math.max(...all.map(node=>node.logProb))
  for(const width of [2,3,4]){
    const search=simulateBeam(width,0)
    expect(search.best.logProb).toBeGreaterThan(greedy.best.logProb)
    expect(search.best.logProb).toBeCloseTo(oracle,12)
    expect(search.best.tokens).toEqual(['a','quiet','night'])
    expect(Math.exp(search.best.logProb)).toBeCloseTo(.43*.85*.92,12)
  }
})
it('conserves every conditional distribution and accumulates the annotated path scores',()=>{
  const {nodes,frames}=simulateBeam(3,.9)
  expect(frames).toHaveLength(4)
  for(const node of nodes){
    if(node.children.length) expect(node.children.reduce((sum,id)=>sum+nodes[id]!.probability,0)).toBeCloseTo(1,12)
    if(node.parent!==null) expect(node.logProb).toBeCloseTo(nodes[node.parent]!.logProb+Math.log(node.probability),12)
    expect(node.score).toBeCloseTo(beamScore(node.logProb,node.depth,.9),12)
  }
  for(const f of frames){
    expect(f.activeIds.length).toBeLessThanOrEqual(3)
    expect(f.activeIds.every(id=>!f.prunedIds.includes(id))).toBe(true)
  }
})
it('carries completed paths forward exactly once and allows a length penalty to change the winner',()=>{
  const graph:Branch[]=[{token:'short',p:.51},{token:'long',p:.49,next:[{token:'second',p:1,next:[{token:'last',p:1}]}]}]
  const raw=simulateBeam(2,0,graph), normalized=simulateBeam(2,1.5,graph)
  expect(raw.best.tokens).toEqual(['short'])
  expect(normalized.best.tokens).toEqual(['long','second','last'])
  for(const frame of raw.frames.slice(1)) expect(frame.activeIds.filter(n=>n===1)).toHaveLength(1)
  expect(normalized.best.score).toBeCloseTo(Math.log(.49)/((5+3)/6)**1.5,13)
})
it('rejects invalid beam sizes and malformed probability tables',()=>{
  expect(()=>simulateBeam(0,1)).toThrow(RangeError)
  expect(()=>simulateBeam(2,-1)).toThrow(RangeError)
  expect(()=>simulateBeam(2,0,[{token:'broken',p:.8}])).toThrow(RangeError)
})
