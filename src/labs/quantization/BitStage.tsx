import { bitRows, type BitMasks, type BitRow } from '../../engine/labs/quantization/bits'
import type { FloatFormat } from '../../engine/math/ieee754'
import { useI18n } from '../../i18n'
import { bitCopy } from '../../i18n/labs/quantization-bits'
import './bits.css'

interface Props {
  value:number
  masks:BitMasks
  activeFormat:FloatFormat
}
interface Actions {
  onFlip:(format:FloatFormat,index:number)=>void
  onFormat:(format:FloatFormat)=>void
}

const names:Record<FloatFormat,string>={fp32:'FP32',fp16:'FP16',bf16:'BF16',fp8_e4m3:'FP8 E4M3',fp8_e5m2:'FP8 E5M2'}
function decimal(value:number) {
  if (Object.is(value,-0)) return '−0'
  if (value===Infinity) return '+∞'
  if (value===-Infinity) return '−∞'
  return String(value)
}

function MagnitudeChart({rows,activeFormat}:{rows:BitRow[];activeFormat:FloatFormat}) {
  const {locale}=useI18n(), t=bitCopy[locale]
  const lower=Math.floor(Math.log10(Math.min(...rows.map(row=>row.minSubnormal))))
  const upper=Math.ceil(Math.log10(Math.max(...rows.map(row=>row.maxFinite))))
  const x=(log:number)=>80+398*(log-lower)/(upper-lower)
  const ticks=Array.from({length:Math.floor(upper/20)-Math.ceil(lower/20)+1},(_,i)=>(Math.ceil(lower/20)+i)*20)
  return <figure className="bits-range"><figcaption>{t.range}</figcaption>
    <svg role="img" aria-label={t.range} viewBox="0 0 492 136">
      {ticks.map(log=><g key={log}><line x1={x(log)} x2={x(log)} y1="4" y2="113" stroke="var(--border-strong)"/>
        <text textAnchor="middle" x={x(log)} y="130">10<tspan dy="-3" fontSize="8">{log}</tspan></text></g>)}
      {rows.map((row,i)=>{
        const y=13+22*i
        const active=activeFormat===row.format
        const magnitude=Math.abs(row.represented)
        return <g key={row.format}>
          <text x="0" y={y+4}>{names[row.format]}</text>
          <line x1={x(Math.log10(row.minSubnormal))} x2={x(Math.log10(row.maxFinite))}
            y1={y} y2={y} stroke={active?'var(--accent-primary)':'var(--text-muted)'} strokeWidth={active?3:1.5}/>
          {magnitude>0 && Number.isFinite(magnitude) && <circle cx={x(Math.log10(magnitude))} cy={y} r={active?4:3}
            fill="var(--accent-warn)" stroke="var(--bg-canvas)"/>}
        </g>
      })}
    </svg><p>{t.extent}</p>
  </figure>
}

export function BitStage({value,masks,activeFormat,onFlip,onFormat}:Props & Actions) {
  const {locale}=useI18n(), t=bitCopy[locale]
  const rows=bitRows(value,masks)
  return <div className="bits-stage">
    <h2>{t.title}</h2><p>{t.help}</p>
    <div className="bits-legend">{(['sign','exponent','mantissa'] as const).map(part=>
      <span data-part={part} key={part}><i/>{t[part]}</span>)}</div>
    {rows.map(row=><section key={row.format} data-active={row.format===activeFormat}>
      <div className="bits-row-title"><button onClick={()=>onFormat(row.format)} aria-pressed={row.format===activeFormat}>{names[row.format]}</button>
        <output>{decimal(row.represented)}</output></div>
      <div className="bits-payload" role="group" aria-label={names[row.format]}>
        {row.digits.map((digit,index)=>{
          const part=index===0?'sign':index<=row.exponentBits.length?'exponent':'mantissa'
          const label=[t.flip,names[row.format],t[part],t.bit,index].join(' ')
          return <button key={index} data-format={row.format} data-bit={index} data-part={part} title={label}
            aria-label={label} aria-pressed={Boolean(digit)} onClick={()=>onFlip(row.format,index)}>{digit}</button>
        })}
      </div>
    </section>)}
    <MagnitudeChart rows={rows} activeFormat={activeFormat}/>
  </div>
}

export function BitInspector({value,masks,activeFormat}:Props) {
  const {locale}=useI18n(), t=bitCopy[locale]
  const row=bitRows(value,masks).find(r=>r.format===activeFormat)!
  const category=row.isNaN?t.nan:row.isInf?t.inf:row.isSubnormal?t.subnormal:row.represented===0?t.zero:t.normalClass
  const fields=[
    [t.input,decimal(value)],[t.base,decimal(row.unedited)],[t.value,decimal(row.represented)],
    [t.category,category],[t.bias,String(row.exponentBias)],[t.error,Number.isNaN(row.absError)?t.unavailable:decimal(row.absError)],
    [t.ulp,row.ulp===null?t.unavailable:decimal(row.ulp)],[t.min,decimal(row.minSubnormal)],
    [t.normal,decimal(row.minNormal)],[t.max,decimal(row.maxFinite)],
  ]
  return <div className="bits-inspector"><h3>{names[activeFormat]}</h3><dl>{fields.map(([label,answer])=>
    <div key={label}><dt>{label}</dt><dd><output data-decoded={label===t.value?true:undefined}>{answer}</output></dd></div>)}</dl></div>
}
