import { useMemo } from 'react'
import { usePlotWidth } from '../../components/viz/usePlotInteraction'
import { formatPlotValue } from '../../components/viz/LineChart'
import { buildQuantGrid } from '../../engine/labs/quantization/grid'
import type { QuantResult } from '../../engine/labs/quantization/engine'
import { useI18n } from '../../i18n'
import { quantVisuals } from '../../i18n/labs/quant-visuals'

export function QuantHistogram({result,row,col}:{result:QuantResult;row:number;col:number}){
  const {locale}=useI18n(),t=quantVisuals[locale]
  const flat=row*result.original.cols+col
  const group=Math.floor(flat/result.groupSize)*result.groupSize
  // With migration disabled, every channel in a group shares a codebook.
  const groupCol=result.channelScales.every(v=>v===1)?group%result.original.cols:col
  const representative=Math.ceil((group-groupCol)/result.original.cols)*result.original.cols+groupCol
  const groupRow=Math.floor(representative/result.original.cols)
  const grid=useMemo(()=>buildQuantGrid(result,groupRow,groupCol),[result,groupRow,groupCol])
  const { ref, width } = usePlotWidth(480)
  const left=35,right=width-29,bottom=112
  const x=(v:number)=>left+(right-left)*(v-grid.min)/(grid.max-grid.min)
  const peak=Math.max(1,...grid.bins.map(b=>b.count))
  const y=(count:number)=>bottom-92*count/peak
  const grouped=grid.groupEnd-grid.groupStart<result.original.data.length
  return <section className="quant-hist"><h3>{t.hist}</h3>
    <div className="quant-key"><span><i className="quant-all"/>{t.count}</span>{grouped&&<span><i className="quant-local"/>{t.local}</span>}
      <span><i className="quant-tick"/>{t.grid}</span></div>
    <svg ref={ref} viewBox={`0 0 ${width} 158`} role="img" aria-label={t.hist}>
      {[0,Math.ceil(peak/2),peak].filter((v,i,a)=>a.indexOf(v)===i).map(n=><g key={n}><line x1={left} x2={right} y1={y(n)} y2={y(n)} stroke="var(--border-strong)"/>
        <text x={left-4} y={y(n)+3} textAnchor="end">{n}</text></g>)}
      {grid.bins.map((bin,i)=><g key={i}>
        <rect x={x(bin.low)} y={y(bin.count)} width={Math.max(0,x(bin.high)-x(bin.low)-.5)} height={bottom-y(bin.count)} className="quant-all">
          <title>[{formatPlotValue(bin.low)}, {formatPlotValue(bin.high)}] · {bin.count}</title></rect>
        {grouped&&<rect x={x(bin.low)} y={y(bin.groupCount)} width={Math.max(0,x(bin.high)-x(bin.low)-.5)} height={bottom-y(bin.groupCount)} className="quant-local"/>}
      </g>)}
      {grid.ticks.map((tick,i)=><line key={i} x1={x(tick.value)} x2={x(tick.value)} y1={grid.levelCount>128?105:15} y2="119"
        stroke="var(--accent-warn)" opacity={grid.levelCount>128?.8:.6} strokeWidth={grid.levelCount>128?.7:1}>
        <title>{formatPlotValue(tick.low)} … {formatPlotValue(tick.high)} · {tick.count}</title></line>)}
      <line x1={x(result.dequantized.get(row,col))} x2={x(result.dequantized.get(row,col))} y1="10" y2="119" stroke="var(--text-primary)" strokeDasharray="3 3"/>
      {[grid.min,0,grid.max].filter((v,i,a)=>a.indexOf(v)===i).map(v=><text key={v} x={x(v)} y="134" textAnchor="middle">{formatPlotValue(v)}</text>)}
      <text x={(left+right)/2} y="152" textAnchor="middle">{t.axis}</text>
    </svg>
    <p>{t.levels} <b>{grid.levelCount.toLocaleString(locale)}</b>{grouped&&` · ${t.group} ${grid.groupStart}–${grid.groupEnd-1}`}</p>
    {grid.ticks.length<grid.levelCount&&<p>{t.coalesced}</p>}
  </section>
}
