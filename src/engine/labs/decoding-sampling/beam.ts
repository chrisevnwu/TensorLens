/** Entries are a teaching vocabulary's conditional next-token probabilities. Leaves terminate a sequence. */
export interface Branch { token:string; p:number; next?:Branch[] }
const trap:Branch[]=[
  {token:'the',p:.54,next:[
    {token:'old',p:.56,next:[{token:'tree',p:.36},{token:'house',p:.34},{token:'boat',p:.30}]},
    {token:'last',p:.44,next:[{token:'time',p:.55},{token:'day',p:.45}]},
  ]},
  {token:'a',p:.43,next:[
    {token:'quiet',p:.85,next:[{token:'night',p:.92},{token:'morning',p:.08}]},
    {token:'pause',p:.15},
  ]},
  {token:'another',p:.03,next:[{token:'day',p:.7},{token:'night',p:.3}]},
]

export interface BeamNode {
  id:number
  parent:number|null
  depth:number
  token:string
  tokens:string[]
  probability:number
  logProb:number
  score:number
  children:number[]
}
export interface BeamFrame {
  step:number
  bestId:number
  activeIds:number[]
  expandedIds:number[]
  prunedIds:number[]
  seenIds:number[]
}
export interface BeamResult {nodes:BeamNode[];frames:BeamFrame[];best:BeamNode}

export function beamScore(logProb:number,length:number,alpha:number) {
  return logProb / ((5+length)/6)**alpha
}

export function simulateBeam(width:number,alpha:number,graph:Branch[]=trap):BeamResult {
  if (!Number.isSafeInteger(width)||width<1||!Number.isFinite(alpha)||alpha<0) throw new RangeError('Invalid beam configuration')
  const root:BeamNode={id:0,parent:null,depth:0,token:'',tokens:[],probability:1,logProb:0,score:0,children:[]}
  const nodes:BeamNode[]=[root]
  function append(branches:Branch[],parent:BeamNode) {
    if (!branches.length || !branches.every(b=>b.p>0 && b.p<=1) || Math.abs(branches.reduce((sum,b)=>sum+b.p,0)-1)>1e-10)
      throw new RangeError('A branching distribution must have unit probability mass')
    for(const b of branches) {
      const depth=parent.depth+1,logProb=parent.logProb+Math.log(b.p)
      const node:BeamNode={id:nodes.length,parent:parent.id,depth,token:b.token,tokens:[...parent.tokens,b.token],
        probability:b.p,logProb,score:beamScore(logProb,depth,alpha),children:[]}
      nodes.push(node)
      parent.children.push(node.id)
      if (b.next) append(b.next,node)
    }
  }
  append(graph,root)
  const seen=new Set([0]),pruned=new Set<number>(),expanded=new Set<number>()
  let active=[0]
  const frames:BeamFrame[]=[]
  function snapshot() {
    frames.push({step:frames.length,bestId:active[0]!,activeIds:[...active],expandedIds:[...expanded],prunedIds:[...pruned],seenIds:[...seen]})
  }
  snapshot()
  while(active.some(id=>nodes[id]!.children.length)){
    const candidates=active.flatMap(id=>{
      const children=nodes[id]!.children
      if (!children.length) return [id]
      expanded.add(id)
      children.forEach(child=>seen.add(child))
      return children
    })
    candidates.sort((a,b)=>nodes[b]!.score-nodes[a]!.score || a-b)
    active=candidates.slice(0,width)
    candidates.slice(width).forEach(id=>pruned.add(id))
    snapshot()
  }
  return {nodes,frames,best:nodes[active[0]!]!}
}
