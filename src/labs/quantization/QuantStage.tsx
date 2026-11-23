import { useMemo } from 'react'
import { MatrixHeatmap, type HeatCell } from '../../components/viz/MatrixHeatmap'
import type { QuantResult } from '../../engine/labs/quantization/engine'
import { useI18n } from '../../i18n'
import { quantVisuals } from '../../i18n/labs/quant-visuals'
import { QuantHistogram } from './QuantHistogram'
import './quant.css'

interface Props {result:QuantResult;cell:HeatCell;onSelectCell:(cell:HeatCell)=>void}

export function QuantStage({result,cell,onSelectCell}:Props){
  const {locale}=useI18n(),t=quantVisuals[locale]
  const matrices=useMemo(()=>({
    original:result.original.to2D(),dequantized:result.dequantized.to2D(),error:result.errors.to2D(),
    bound:Math.max(1e-12,...result.original.data.map(Math.abs),...result.dequantized.data.map(Math.abs)),
  }),[result])
  return <div className="quant-stage"><h2>{t.tensors}</h2>
    <div className="quant-maps">{(['original','dequantized','error'] as const).map(key=><figure key={key} data-quant-map={key}>
      <figcaption>{t[key]}</figcaption>
      <MatrixHeatmap values={matrices[key]} label={t[key]} signed={key!=='error'} domain={key==='error'?result.maxAbsError:matrices.bound}
        selected={cell} onSelect={onSelectCell}/>
    </figure>)}</div>
    <QuantHistogram result={result} row={cell.row} col={cell.col}/>
  </div>
}

export function QuantInspector({result,cell}:Pick<Props,'result'|'cell'>){
  const {locale}=useI18n(),t=quantVisuals[locale]
  const {row,col}=cell
  const flat=row*result.original.cols+col, groupStart=Math.floor(flat/result.groupSize)*result.groupSize
  const metrics=[
    ['original',t.original,result.original.get(row,col)],['code',t.code,result.codes.get(row,col)],
    ['scale',t.scale,result.scales.get(row,col)],['zero',t.zero,result.zeroPoints.get(row,col)],
    ['channel',t.channel,result.channelScales[col]!],['dequantized',t.dequantized,result.dequantized.get(row,col)],
    ['error',t.error,result.errors.get(row,col)],
  ] as const
  return <section className="quant-inspector"><h3>{t.cell} [{row}, {col}]</h3>
    <dl>{metrics.map(([key,label,n])=><div key={key}><dt>{label}</dt><dd data-quant-readout={key} title={String(n)}>{Number.isInteger(n)?String(n):n.toPrecision(9)}</dd></div>)}
      <div><dt>{t.group}</dt><dd>{groupStart}–{Math.min(groupStart+result.groupSize,result.original.data.length)-1}</dd></div>
    </dl>
  </section>
}
