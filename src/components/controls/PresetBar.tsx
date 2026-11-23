import { useI18n } from '../../i18n'
import { workbenchCopy } from '../../i18n/workbench'

export interface LabPreset {
  id: string
  label: string
  active: boolean
  onSelect: () => void
}

export function PresetBar({ presets }: { presets: readonly LabPreset[] }) {
  const { locale } = useI18n()
  return <fieldset className="wb-control wb-presets">
    <legend>{workbenchCopy[locale].presets}</legend>
    <div className="wb-segmented">{presets.map(preset =>
      <button key={preset.id} type="button" aria-pressed={preset.active} onClick={preset.onSelect}>{preset.label}</button>
    )}</div>
  </fieldset>
}
