import { useLayoutEffect, useRef, useState } from 'react'
import { useI18n } from '../../i18n'
import { getLabById } from '../../labs/registry'
import { StepController } from '../controls/StepController'
import { LabShell, type LabShellProps } from './LabShell'

interface ExperimentShellProps extends Omit<LabShellProps,
  'title' | 'subtitle' | 'stepper' | 'onPrevStep' | 'onNextStep' | 'onTogglePlay'> {
  subtitle?: string
  step: number
  maxStep: number
  intervalMs?: number
  onStepChange: (step: number) => void
}
export function ExperimentShell({ step, maxStep, onStepChange, intervalMs, subtitle, ...props }: ExperimentShellProps) {
  const { locale } = useI18n()
  const definition = getLabById(props.labId)
  const [playing, setPlaying] = useState(false)
  const playbackStep = useRef(step)
  useLayoutEffect(() => {
    // A chart or parameter control can seek independently of the playback timer.
    if (playing && playbackStep.current !== step) setPlaying(false)
    playbackStep.current = step
  }, [step, playing])
  const advance = (next: number) => {
    playbackStep.current = next
    onStepChange(next)
  }
  if (!definition) throw new Error('Unknown experiment ID')
  const pauseAndStep = (next: number) => {
    setPlaying(false)
    onStepChange(Math.max(0, Math.min(maxStep, next)))
  }
  const toggle = () => {
    if (!maxStep) return
    if (!playing && step >= maxStep) advance(0)
    setPlaying(!playing)
  }
  return <LabShell {...props} title={definition.title[locale]} subtitle={subtitle ?? definition.description[locale]}
    onReset={() => { setPlaying(false); props.onReset() }}
    presets={props.presets?.map(p => ({ ...p, onSelect: () => { setPlaying(false); p.onSelect() } }))}
    onPrevStep={() => pauseAndStep(step-1)} onNextStep={() => pauseAndStep(step+1)} onTogglePlay={toggle}
    stepper={<StepController step={step} maxStep={maxStep} intervalMs={intervalMs} onStepChange={advance}
      playing={playing} onPlayingChange={setPlaying} />} />
}
