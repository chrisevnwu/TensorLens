import { Component, Suspense, useEffect, type ReactNode } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { useI18n } from '../i18n'
import { navigationText } from '../i18n/navigation'
import { getLabById } from '../labs/registry'
import { useAppStore } from '../store/useAppStore'

class LabErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? this.props.fallback : this.props.children }
}

export default function LabPage() {
  const { labId = '' } = useParams()
  const location = useLocation()
  const { locale } = useI18n()
  const lab = getLabById(labId)
  const setVisited = useAppStore(state => state.setLastVisitedLabId)
  const t = navigationText[locale]
  useEffect(() => {
    if (lab) setVisited(lab.id)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [lab, setVisited])

  if (!lab) return (
    <main className="tl-overview">
      <h1>{t.missing}</h1><p>{t.missingDetail}</p>
      <Link to="/"><ArrowLeft size={16} /> {t.home}</Link>
    </main>
  )
  const ActiveLab = lab.component
  return (
    <LabErrorBoundary key={location.key} fallback={<main className="tl-overview"><h1>{t.failed}</h1>
      <button type="button" onClick={() => window.location.reload()}>{t.retry}</button> <Link to="/">{t.home}</Link></main>}>
      <Suspense fallback={<main className="tl-overview" role="status">{t.loading}</main>}><ActiveLab /></Suspense>
    </LabErrorBoundary>
  )
}
