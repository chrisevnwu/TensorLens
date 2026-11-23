import { usePlotScrub } from '../../components/viz/usePlotInteraction'
import { useI18n } from '../../i18n'
import { samplingVisuals } from '../../i18n/labs/sampling-visuals'

interface LogitProps {
  token: string
  value: number
  label: string
  onChange: (value: number) => void
  onSelect: () => void
}

function LogitControl({ token, value, label, onChange, onSelect }: LogitProps) {
  const scrub = usePlotScrub(x => onChange(Math.round((-12 + Math.min(100, Math.max(0, x)) * .24) * 10) / 10))
  return <label>
    <span>{token}</span>
    <svg role="slider" tabIndex={0} aria-label={label + ' · ' + token} aria-valuemin={-12} aria-valuemax={12} aria-valuenow={value}
      viewBox="0 0 100 13" preserveAspectRatio="none" onFocus={onSelect} {...scrub}
      onKeyDown={event => {
        const keys: Record<string,number> = { ArrowLeft:value-.1, ArrowDown:value-.1, ArrowRight:value+.1, ArrowUp:value+.1, Home:-12, End:12 }
        const next = keys[event.key]
        if (next !== undefined) {
          event.preventDefault()
          event.stopPropagation()
          onChange(Math.round(Math.max(-12,Math.min(12,next))*10)/10)
        }
      }}>
      <rect x="0" y="4" width="100" height="5" fill="var(--bg-elevated)"/>
      <rect x={Math.min(50,50+value*50/12)} y="4" width={Math.abs(value)*50/12} height="5" fill={value<0?'var(--accent-secondary)':'var(--accent-primary)'}/>
      <line x1="50" x2="50" y1="1" y2="12" stroke="var(--text-muted)"/>
    </svg>
    <output>{value.toFixed(1)}</output>
  </label>
}

export function CustomLogits({tokens,logits,onChange,onSelect}:{
  tokens:readonly string[];logits:readonly number[];onChange:(i:number,v:number)=>void;onSelect:(i:number)=>void
}){
  const {locale}=useI18n(),t=samplingVisuals[locale]
  return <section className="custom-logits"><h3>{t.drag}</h3><div>
    {logits.map((value,i) => <LogitControl key={i} token={tokens[i]!} label={t.logit} value={value}
      onChange={next => onChange(i,next)} onSelect={() => onSelect(i)}/>)}
  </div></section>
}
