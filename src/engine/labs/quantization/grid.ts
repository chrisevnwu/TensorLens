import { decodeFloatBits, inspectFloatFormat, type FloatFormat } from '../../math/ieee754'
import { NF4_CODEBOOK, type QuantResult } from './engine'

type GridInput = Pick<QuantResult, 'method'|'original'|'dequantized'|'scales'|'zeroPoints'|'groupSize'|'channelScales'>
interface Levels { size: number; value: (rank:number)=>number }
export interface GridTick { value:number; low:number; high:number; count:number }
export interface HistogramBin { low:number; high:number; count:number; groupCount:number }
export interface QuantGrid {
  min:number
  max:number
  bins:HistogramBin[]
  ticks:GridTick[]
  levelCount:number
  groupStart:number
  groupEnd:number
}

// Positive finite IEEE payloads are ordered by magnitude. Mirror them about
// one shared zero to obtain an ordered index with no infinities or NaNs.
function floatLevels(format: FloatFormat, migration: number): Levels {
  const layout = inspectFloatFormat(0,format)
  const e = layout.exponentBits.length, m = layout.mantissaBits.length
  const signBit = 2**(e+m)
  const largest = format==='fp8_e4m3' ? signBit-2 : signBit-2**m-1
  return {
    size: largest*2+1,
    value(rank) {
      const offset = rank-largest
      const bits = offset<0 ? signBit-offset : offset
      return decodeFloatBits(bits,format)*migration
    },
  }
}

function codeLevels(input:GridInput,row:number,col:number):Levels {
  const method=input.method, migration=input.channelScales[col]!
  if (method==='fp16'||method==='bf16'||method==='fp8_e4m3') return floatLevels(method,migration)
  const scale=input.scales.get(row,col)*migration
  if (scale===0) return {size:1,value:()=>0}
  if (method==='nf4') return {size:NF4_CODEBOOK.length,value:i=>NF4_CODEBOOK[i]!*scale}
  const eight=method==='int8_sym'||method==='int8_asym'
  const affine=method==='int4_asym'||method==='int8_asym'
  const half=eight?128:8
  const zero=affine ? input.zeroPoints.get(row,col) : half-1
  return {size:affine?2*half:2*half-1,value:i=>(i-zero)*scale}
}

function bound(levels:Levels,threshold:number,strict:boolean,lo=0,hi=levels.size) {
  while(lo<hi){
    const mid=lo+Math.floor((hi-lo)/2)
    const v=levels.value(mid)
    if(v<threshold || (strict&&v===threshold)) lo=mid+1
    else hi=mid
  }
  return lo
}

function visibleTicks(levels:Levels,min:number,max:number,columns:number) {
  const first=bound(levels,min,false), end=bound(levels,max,true,first)
  const levelCount=end-first
  const tick=(from:number,to:number):GridTick=>({
    low:levels.value(from),high:levels.value(to-1),
    value:levels.value(from+Math.floor((to-from-1)/2)),count:to-from,
  })
  if(levelCount<=columns) return {levelCount,ticks:Array.from({length:levelCount},(_,i)=>tick(first+i,first+i+1))}
  const ticks:GridTick[]=[]
  let cursor=first
  for(let i=1;i<=columns&&cursor<end;i++){
    const next=i===columns?end:bound(levels,min+(max-min)*i/columns,false,cursor,end)
    if(next>cursor) ticks.push(tick(cursor,next))
    cursor=next
  }
  return {ticks,levelCount}
}

/** Tensor histogram with the selected group's original-domain reconstruction grid. */
export function buildQuantGrid(input:GridInput,row:number,col:number,binCount=40,columns=256):QuantGrid {
  if(!Number.isSafeInteger(binCount)||binCount<1||!Number.isSafeInteger(columns)||columns<1)
    throw new RangeError('Positive histogram and display resolutions required')
  const {original,dequantized,method}=input
  if(!Number.isInteger(row)||row<0||row>=original.rows||!Number.isInteger(col)||col<0||col>=original.cols)
    throw new RangeError('Tensor cell outside the grid')
  const flat=row*original.cols+col
  const groupSize=method==='int4_group'||method==='nf4'?input.groupSize:original.data.length
  const groupStart=Math.floor(flat/groupSize)*groupSize,groupEnd=Math.min(groupStart+groupSize,original.data.length)
  const levels=codeLevels(input,row,col)
  let min=0,max=0
  for(const data of [original.data,dequantized.data]){
    for(const v of data) if(Number.isFinite(v)){ min=Math.min(min,v);max=Math.max(max,v) }
  }
  // A finite integer codebook can extend beyond the observed extrema after
  // clipping/rounding, or when a channel migration changes the selected grid.
  if(method!=='fp16' && method!=='bf16' && method!=='fp8_e4m3'){
    min=Math.min(min,levels.value(0))
    max=Math.max(max,levels.value(levels.size-1))
  }
  if(min===max){min-=1;max+=1}
  const bins:HistogramBin[]=Array.from({length:binCount},(_,i)=>({
    low:min+(max-min)*i/binCount,high:min+(max-min)*(i+1)/binCount,count:0,groupCount:0,
  }))
  original.data.forEach((v,i)=>{
    const bin=Math.max(0,Math.min(binCount-1,Math.floor((v-min)/(max-min)*binCount)))
    bins[bin]!.count++
    if(i>=groupStart&&i<groupEnd) bins[bin]!.groupCount++
  })
  return {min,max,bins,groupStart,groupEnd,...visibleTicks(levels,min,max,columns)}
}
