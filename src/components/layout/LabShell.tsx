import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from 'react'
import { ArrowLeft, ArrowRight, Download, Link2, PanelLeft, PanelRight, RotateCcw } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useI18n } from '../../i18n'
import { workbenchCopy } from '../../i18n/workbench'
import { getAdjacentLabs } from '../../labs/registry'
import type { ChallengeStatus } from '../../labs/types'
import { useAppStore } from '../../store/useAppStore'
import { PresetBar, type LabPreset } from '../controls/PresetBar'
import { ChallengePanel } from '../viz/ChallengePanel'
import { MetricCard } from '../viz/MetricCard'
import { exportSnapshot } from '../utils/exportSnapshot'
import './workbench.css'

export interface LabShellProps {
  labId: string
  title: string
  subtitle: string
  presets?: readonly LabPreset[]
  onReset: () => void
  getShareUrl?: () => string
  controls: ReactNode
  challenges: ChallengeStatus[]
  formula?: ReactNode
  stage: ReactNode
  stepper?: ReactNode
  metrics: { label: string; value: string; hint?: string; tone?: 'neutral' | 'accent' | 'good' | 'warn' | 'danger' }[]
  inspector?: ReactNode
  explainer: ReactNode
  onNextStep?: () => void
  onPrevStep?: () => void
  onTogglePlay?: () => void
}

const tabs = ['controls', 'inspector', 'challenges'] as const
type MobileTab = typeof tabs[number]
const noneCompleted: string[] = []

export function LabShell(props: LabShellProps) {
  const { labId, title, subtitle, challenges, onReset, onNextStep, onPrevStep, onTogglePlay } = props
  const { locale } = useI18n()
  const t = workbenchCopy[locale]
  const stageRef = useRef<HTMLDivElement>(null)
  const tabletButton = useRef<HTMLButtonElement>(null)
  const copyField = useRef<HTMLInputElement>(null)
  const [mobileTab, setMobileTab] = useState<MobileTab>('controls')
  const [tabletInspector, setTabletInspector] = useState(false)
  const [message, setMessage] = useState<'copied' | 'exported' | 'exportFailed' | 'manual' | null>(null)
  const [manualUrl, setManualUrl] = useState('')
  const [exporting, setExporting] = useState(false)
  const savedChallenges = useAppStore(state => state.completedChallenges[labId] ?? noneCompleted)
  const leftCollapsed = useAppStore(state => state.leftCollapsed)
  const rightCollapsed = useAppStore(state => state.rightCollapsed)
  const { setLeftCollapsed, setRightCollapsed, markChallengeCompleted } = useAppStore.getState()
  const { previous, next } = getAdjacentLabs(labId)

  useEffect(() => {
    for (const item of challenges) {
      if (item.completed && !savedChallenges.includes(item.id)) markChallengeCompleted(labId, item.id)
    }
  }, [labId, challenges, savedChallenges, markChallengeCompleted])

  useEffect(() => {
    if (message === 'manual') {
      copyField.current?.select()
      return
    }
    if (!message) return
    const timer = window.setTimeout(() => setMessage(null), 3200)
    return () => window.clearTimeout(timer)
  }, [message])

  useEffect(() => {
    function shortcut(event: KeyboardEvent) {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.isComposing) return
      if (document.querySelector('[role="dialog"], dialog[open]')) return
      if (event.key === 'Escape' && tabletInspector) {
        setTabletInspector(false)
        tabletButton.current?.focus()
        return
      }
      const target = event.target instanceof Element ? event.target : null
      if (target?.closest('input, select, textarea, [contenteditable]:not([contenteditable="false"]), [role="slider"], [role="tablist"]')) return
      if (event.key === ' ' && target?.closest('button, a, summary, [role="button"]')) return
      const actions: Record<string, (() => void) | undefined> = {
        ' ': onTogglePlay, arrowright: onNextStep, arrowleft: onPrevStep, r: onReset,
      }
      const action = actions[event.key.toLowerCase()]
      if (action) { event.preventDefault(); action() }
    }
    window.addEventListener('keydown', shortcut)
    return () => window.removeEventListener('keydown', shortcut)
  }, [onReset, onNextStep, onPrevStep, onTogglePlay, tabletInspector])

  async function share() {
    const url = props.getShareUrl?.() ?? window.location.href
    try {
      await navigator.clipboard.writeText(url)
      setMessage('copied')
    } catch {
      setManualUrl(url)
      setMessage('manual')
    }
  }
  async function download() {
    if (!stageRef.current || exporting) return
    setExporting(true)
    try {
      await exportSnapshot(stageRef.current, labId, title)
      setMessage('exported')
    } catch {
      setMessage('exportFailed')
    } finally {
      setExporting(false)
    }
  }
  function navigateTabs(event: ReactKeyboardEvent<HTMLDivElement>) {
    const index = tabs.indexOf(mobileTab)
    const move: Record<string, number> = { ArrowLeft: (index + 2) % 3, ArrowRight: (index + 1) % 3, Home: 0, End: 2 }
    const nextIndex = move[event.key]
    if (nextIndex === undefined) return
    event.preventDefault()
    const selected = tabs[nextIndex]!
    setMobileTab(selected)
    event.currentTarget.querySelector<HTMLButtonElement>(`#tab-${selected}`)?.focus()
  }
  const challengeItems = challenges.map(item => ({
    ...item, completed: item.completed || savedChallenges.includes(item.id),
  }))

  return <main className="workbench" data-left={leftCollapsed ? 'closed' : 'open'}
    data-right={rightCollapsed ? 'closed' : 'open'} data-inspector={tabletInspector ? 'open' : 'closed'} data-tab={mobileTab}>
    <header className="wb-toolbar">
      <div className="wb-title"><h1>{title}</h1><p>{subtitle}</p></div>
      <div className="wb-actions">
        <button type="button" onClick={share}><Link2 />{t.share}</button>
        <button type="button" disabled={exporting} onClick={download}><Download />{t.export}</button>
        <button type="button" onClick={onReset}><RotateCcw />{t.reset}</button>
        <div className="wb-rail-toggles">
          <button type="button" aria-controls="wb-rail" aria-expanded={!leftCollapsed}
            aria-label={leftCollapsed ? t.expandControls : t.collapseControls} title={leftCollapsed ? t.expandControls : t.collapseControls}
            onClick={() => setLeftCollapsed(!leftCollapsed)}><PanelLeft /></button>
          <button type="button" aria-controls="wb-inspector" aria-expanded={!rightCollapsed}
            aria-label={rightCollapsed ? t.expandInspector : t.collapseInspector} title={rightCollapsed ? t.expandInspector : t.collapseInspector}
            onClick={() => setRightCollapsed(!rightCollapsed)}><PanelRight /></button>
        </div>
        <button type="button" className="wb-tablet-toggle" ref={tabletButton} aria-controls="wb-inspector" aria-expanded={tabletInspector}
          onClick={() => setTabletInspector(!tabletInspector)}><PanelRight />{t.inspector}</button>
      </div>
    </header>
    <div className="wb-grid">
      <section className="wb-stage" aria-label={t.stage}>
        {props.formula}
        <div className="wb-stage-surface" ref={stageRef}>{props.stage}</div>
        {props.stepper}
      </section>
      <div className="wb-tabs" role="tablist" aria-label={title} onKeyDown={navigateTabs}>
        {tabs.map(tab => <button type="button" role="tab" id={`tab-${tab}`} aria-controls={`wb-${tab}`}
          tabIndex={mobileTab === tab ? 0 : -1} key={tab} aria-selected={mobileTab === tab}
          onClick={() => setMobileTab(tab)}>{t[tab]}</button>)}
      </div>
      <aside id="wb-rail" className="wb-rail" aria-label={t.controls}>
        <section id="wb-controls" className="wb-controls">
          <h2>{t.controls}</h2>
          {props.presets && props.presets.length > 0 && <PresetBar presets={props.presets} />}
          {props.controls}
        </section>
        <section id="wb-challenges" className="wb-challenges">
          <h2>{t.challenges}</h2>
          <ChallengePanel challenges={challengeItems} />
        </section>
      </aside>
      <aside className="wb-inspector" id="wb-inspector" aria-label={t.inspector}>
        <section><h2>{t.metrics}</h2><div className="wb-metrics">{props.metrics.map(metric =>
          <MetricCard key={metric.label} {...metric} />)}</div></section>
        {props.inspector && <section><h2>{t.details}</h2>{props.inspector}</section>}
        <section><h2>{t.guide}</h2>{props.explainer}</section>
      </aside>
    </div>
    <nav className="wb-neighbors" aria-label={t.neighbors}>
      {previous && <Link to={`/labs/${previous.id}`}><ArrowLeft /><span><small>{t.previousLab}</small>{previous.title[locale]}</span></Link>}
      {next && <Link className="wb-next" to={`/labs/${next.id}`}><span><small>{t.nextLab}</small>{next.title[locale]}</span><ArrowRight /></Link>}
    </nav>
    {message && <div className="wb-toast" role="status">
      {t[message]}
      {message === 'manual' && <input aria-label={t.share} ref={copyField} value={manualUrl} readOnly onFocus={event => event.target.select()} />}
    </div>}
  </main>
}

export default LabShell
