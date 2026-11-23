import { useMemo } from 'react'
import { MatrixHeatmap, type HeatCell } from '../../components/viz/MatrixHeatmap'
import type { Matrix } from '../../engine/math/matrix'

interface Props {label:string;matrix:Matrix;cell?:HeatCell;onSelectCell?:(cell:HeatCell)=>void;domain?:number;name:string}
export function FactorTile({label,matrix,cell,onSelectCell,domain,name}:Props){
  const grid=useMemo(()=>matrix.to2D(),[matrix])
  return <figure className="factor-tile" data-factor={name}><figcaption>{label}</figcaption>
    <div className="factor-frame"><div style={{width:100*matrix.cols/16+'%',height:100*matrix.rows/16+'%'}}>
      <MatrixHeatmap values={grid} label={label} signed domain={domain} selected={cell} onSelect={onSelectCell}/>
    </div></div>
    <small>{matrix.rows} × {matrix.cols}</small>
    {cell && <span className="matrix-cell-value" title={String(matrix.get(cell.row,cell.col))}>
      {Number(matrix.get(cell.row,cell.col).toPrecision(5))}
    </span>}
  </figure>
}
