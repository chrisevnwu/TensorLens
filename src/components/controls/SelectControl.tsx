import { useId } from 'react'
import type { ChoiceProps } from './SegmentedControl'

export function SelectControl<T extends string | number>({label, value, options, onChange}: ChoiceProps<T>) {
  const id = useId()
  return <div className="wb-control">
    <label htmlFor={id}>{label}</label>
    <select id={id} value={String(value)} onChange={event => {
      const selected = options.find(option => String(option.value) === event.currentTarget.value)
      if (selected) onChange(selected.value)
    }}>{options.map(option => <option key={option.value} value={String(option.value)}>{option.label}</option>)}</select>
  </div>
}
