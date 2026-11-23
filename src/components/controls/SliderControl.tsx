import { useId } from 'react'

interface Props {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
  format?: (value: number) => string
}

export function SliderControl({ label, value, min, max, step = 1, onChange, format = String }: Props) {
  const id = useId()
  return <div className="wb-control">
    <div className="wb-control-heading"><label htmlFor={id}>{label}</label><output htmlFor={id}>{format(value)}</output></div>
    <input id={id} type="range" min={min} max={max} step={step} value={value} aria-valuetext={format(value)}
      onChange={event => onChange(event.currentTarget.valueAsNumber)} />
  </div>
}
