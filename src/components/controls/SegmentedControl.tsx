export interface ChoiceProps<T extends string | number> {
  label: string
  value: T
  options: readonly { value: T; label: string }[]
  onChange: (value: T) => void
}

export function SegmentedControl<T extends string | number>({label, value, options, onChange}: ChoiceProps<T>) {
  return <fieldset className="wb-control">
    <legend>{label}</legend>
    <div className="wb-segmented">{options.map(option =>
      <button type="button" key={option.value} aria-pressed={value === option.value} onClick={() => onChange(option.value)}>
        {option.label}
      </button>)}</div>
  </fieldset>
}
