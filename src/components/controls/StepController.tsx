import { useId, useState } from 'react'
import { ChevronFirst, ChevronLast, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react'
import { useI18n } from '../../i18n'
import { workbenchCopy } from '../../i18n/workbench'
import { useSimulationLoop } from '../utils/useSimulationLoop'

export interface StepControllerProps {
  step: number
  maxStep: number
  onStepChange: (step: number) => void
  playing: boolean
  onPlayingChange: (playing: boolean) => void
  intervalMs?: number
}

export function StepController({step, maxStep, onStepChange, playing, onPlayingChange, intervalMs = 650}: StepControllerProps) {
  const sliderId = useId()
  const { locale } = useI18n()
  const t = workbenchCopy[locale]
  const [speed, setSpeed] = useState(1)
  useSimulationLoop(() => {
    const next = Math.min(step + 1, maxStep)
    if (next !== step) onStepChange(next)
    if (next >= maxStep) onPlayingChange(false)
  }, playing, intervalMs / speed)
  function toggle() {
    if (!playing && step >= maxStep) onStepChange(0)
    onPlayingChange(!playing)
  }
  return <div className="wb-stepper" role="group" aria-label={t.playback}>
    <div className="wb-step-line">
      <label htmlFor={sliderId}>{t.step}</label><output htmlFor={sliderId}>{step} / {maxStep}</output>
        <input id={sliderId} type="range" min="0" max={maxStep} step="1" value={step} onChange={event => {
          onPlayingChange(false)
          onStepChange(event.currentTarget.valueAsNumber)
        }} disabled={maxStep === 0} />
    </div>
    <div className="wb-play-buttons">
      <button type="button" aria-label={t.first} title={t.first} disabled={step === 0} onClick={() => onStepChange(0)}><ChevronFirst /></button>
      <button type="button" aria-label={t.previous} title={t.previous} disabled={step === 0} onClick={() => onStepChange(step - 1)}><ChevronLeft /></button>
      <button type="button" className="wb-play" aria-label={playing ? t.pause : t.play} title={playing ? t.pause : t.play} disabled={maxStep === 0} onClick={toggle}>
        {playing ? <Pause /> : <Play />}
      </button>
      <button type="button" aria-label={t.next} title={t.next} disabled={step >= maxStep} onClick={() => onStepChange(step + 1)}><ChevronRight /></button>
      <button type="button" aria-label={t.last} title={t.last} disabled={step >= maxStep} onClick={() => onStepChange(maxStep)}><ChevronLast /></button>
      <select aria-label={t.speed} value={speed} onChange={event => setSpeed(Number(event.target.value))}>
        {[0.5, 1, 2, 4].map(n => <option value={n} key={n}>{n}×</option>)}
      </select>
    </div>
  </div>
}
