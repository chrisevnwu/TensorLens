interface Props {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}

export function ToggleControl({label, checked, onChange}: Props) {
  return <label className="wb-toggle">
    <span>{label}</span>
    <input type="checkbox" role="switch" checked={checked} onChange={event => onChange(event.currentTarget.checked)} />
  </label>
}
