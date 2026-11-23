import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, expect, it, vi } from 'vitest'
import { useAppStore } from '../../store/useAppStore'
import { LabShell, type LabShellProps } from './LabShell'

const props: LabShellProps = {
  labId: 'embeddings-rope', title: 'Embedding geometry', subtitle: 'Compare angles',
  controls: <input aria-label="Position" />, stage: <svg />, onReset: () => undefined,
  challenges: [{ id: 'rotate', title: 'Rotate', description: 'Adjust the phase', insight: 'Fixed norm', completed: false }],
  metrics: [{ label: 'Angle', value: '1.0' }], explainer: 'Change the angle.',
}

function mount(overrides: Partial<LabShellProps> = {}) {
  return render(<MemoryRouter><LabShell {...props} {...overrides} /></MemoryRouter>)
}

afterEach(() => {
  cleanup()
  useAppStore.setState({ completedChallenges: {}, leftCollapsed: false, rightCollapsed: false })
  vi.unstubAllGlobals()
})

it('persists earned challenges after the live predicate changes back to false', () => {
  const challenge = props.challenges[0]!
  const view = mount()
  expect(useAppStore.getState().completedChallenges).toEqual({})
  view.rerender(<MemoryRouter><LabShell {...props} challenges={[{ ...challenge, completed: true }]} /></MemoryRouter>)
  expect(useAppStore.getState().completedChallenges[props.labId]).toEqual(['rotate'])
  view.rerender(<MemoryRouter><LabShell {...props} /></MemoryRouter>)
  expect(screen.getByText('Rotate').closest('li')).toHaveAttribute('data-complete', 'true')
  expect(screen.getByRole('link', { name: /Previous lab/ })).toHaveAttribute('href', '/labs/bpe-tokenizer')
  expect(screen.getByRole('link', { name: /Next lab/ })).toHaveAttribute('href', '/labs/attention-debugger')
})

it('routes simulation shortcuts while preserving editing and native button behavior', () => {
  const actions = { onNextStep: vi.fn(), onPrevStep: vi.fn(), onTogglePlay: vi.fn(), onReset: vi.fn() }
  mount(actions)
  for (const key of ['ArrowRight', 'ArrowLeft', ' ', 'r']) {
    fireEvent.keyDown(window, { key })
    fireEvent.keyDown(screen.getByRole('textbox'), { key })
  }
  fireEvent.keyDown(screen.getByRole('button', { name: 'Reset' }), { key: ' ' })
  for (const action of Object.values(actions)) expect(action).toHaveBeenCalledTimes(1)
})

it('copies the current configuration synchronously sourced from the lab', async () => {
  const writeText = vi.fn().mockResolvedValue(undefined)
  vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } })
  const getShareUrl = vi.fn(() => 'https://example.test/#/labs/embeddings-rope?step=9')
  mount({ getShareUrl })
  expect(getShareUrl).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: 'Share URL' }))
  expect(writeText).toHaveBeenCalledWith('https://example.test/#/labs/embeddings-rope?step=9')
  expect(await screen.findByText('Experiment link copied.')).toBeVisible()
})

it('retains a manually copyable URL when clipboard access is unavailable', async () => {
  vi.stubGlobal('navigator', { ...navigator, clipboard: undefined })
  const url = 'https://example.test/#/labs/embeddings-rope?step=2'
  mount({ getShareUrl: () => url })
  fireEvent.click(screen.getByRole('button', { name: 'Share URL' }))
  const field = await screen.findByRole('textbox', { name: 'Share URL' })
  expect(field).toHaveValue(url)
  expect(field).toHaveFocus()
  fireEvent.keyDown(field, { key: 'Escape' })
  expect(screen.queryByRole('textbox', { name: 'Share URL' })).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Share URL' })).toHaveFocus()
})

it('associates mobile tabs with their panels and follows arrow keys', () => {
  vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('max-width'), addEventListener: vi.fn(), removeEventListener: vi.fn() }))
  mount()
  const controls = screen.getByRole('tab', { name: 'Controls' })
  expect(screen.getByRole('tabpanel', { name: 'Controls' })).toHaveAttribute('id', controls.getAttribute('aria-controls'))
  fireEvent.keyDown(controls, { key: 'ArrowRight' })
  const inspector = screen.getByRole('tab', { name: 'Inspector & math' })
  expect(inspector).toHaveFocus()
  expect(inspector).toHaveAttribute('aria-selected', 'true')
  expect(screen.getByRole('tabpanel', { name: 'Inspector & math' })).toHaveAttribute('id', inspector.getAttribute('aria-controls'))
})
