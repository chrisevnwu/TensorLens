import { Suspense } from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { PresetBar } from '../components/controls/PresetBar'
import type { LabShellProps } from '../components/layout/LabShell'
import { LAB_REGISTRY } from './registry'
import { getLabPresets } from './presetCatalog'

// Exercise the actual workbench controller, preset buttons, stepper and URL codec.
// Reading the share URL directly keeps these cold-navigation checks independent of clipboard APIs.
vi.mock('../components/layout/LabShell', () => ({
  LabShell: ({ presets, getShareUrl, stepper }: LabShellProps) => <>
    <PresetBar presets={presets!} />
    {stepper}
    <output data-testid="share-url">{getShareUrl!()}</output>
  </>,
}))

afterEach(cleanup)
function currentSettings() {
  const url = new URL(screen.getByTestId('share-url').textContent!)
  return Object.fromEntries(new URLSearchParams(url.hash.split('?')[1]))
}

for (const lab of LAB_REGISTRY) {
  for (const preset of getLabPresets(lab.id)) {
    it(lab.id + '/' + preset.id + ' restores the same settings as its preset button and accepts explicit URL overrides', async () => {
      const Workbench = lab.component
      async function open(query = '') {
        history.replaceState(null, '', '/#/labs/' + lab.id + query)
        render(<Suspense><Workbench /></Suspense>)
        await screen.findByTestId('share-url')
      }
      await open()
      fireEvent.click(screen.getByRole('button', {name:preset.title.en}))
      const clicked = currentSettings()
      expect(clicked.preset).toBe(preset.id)
      const clickedStep = (screen.getByRole('slider') as HTMLInputElement).value
      cleanup()

      await open('?preset=' + preset.id)
      expect(currentSettings()).toEqual(clicked)
      expect(screen.getByRole('button', {name:preset.title.en}).getAttribute('aria-pressed')).toBe('true')
      expect((screen.getByRole('slider') as HTMLInputElement).value).toBe(clickedStep)
      cleanup()

      // Quantization exposes a matrix row or number format as its playhead.
      const key = lab.id === 'quantization' ? (clicked.mode === 'bits' ? 'format' : 'row') : 'step'
      const value = key === 'format' ? 'fp32' : clickedStep === '1' ? '2' : '1'
      await open('?preset=' + preset.id + '&' + key + '=' + value)
      expect(currentSettings()[key]).toBe(value)
      expect(currentSettings().preset).toBe(preset.id)
    })
  }
}
