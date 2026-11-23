import { Component, Suspense, useEffect, type ReactNode } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useI18n } from '../i18n'
import { navigationText } from '../i18n/navigation'
import { getAdjacentLabs, getLabById } from '../labs/registry'
import { useAppStore } from '../store/useAppStore'

class LabErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? this.props.fallback : this.props.children }
}

export default function LabPage() {
  const { labId = '' } = useParams()
  const { locale, common } = useI18n()
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
  if (ActiveLab) return (
    <LabErrorBoundary key={lab.id} fallback={<main className="tl-overview"><h1>{t.failed}</h1>
      <button type="button" onClick={() => window.location.reload()}>{t.retry}</button> <Link to="/">{t.home}</Link></main>}>
      <Suspense fallback={<main className="tl-overview" role="status">{t.loading}</main>}><ActiveLab /></Suspense>
    </LabErrorBoundary>
  )

  const { previous, next } = getAdjacentLabs(lab.id)
  return (
    <main className="tl-overview">
      <Link to="/"><ArrowLeft size={16} /> {t.home}</Link>
      <div className="tl-overview-meta">{common.chapters[lab.chapter]} · {common.difficulties[lab.difficulty]}</div>
      <h1>{lab.title[locale]}</h1><p>{lab.description[locale]}</p>
      <h2>{t.contents}</h2><ul>{lab.tags[locale].map(tag => <li key={tag}>{tag}</li>)}</ul>
      <nav className="tl-overview-neighbors" aria-label={t.explore}>
        {previous && <Link to={'/labs/' + previous.id}><ArrowLeft size={16} /><span><small>{t.previous}</small>{previous.title[locale]}</span></Link>}
        {next && <Link to={'/labs/' + next.id}><span><small>{t.next}</small>{next.title[locale]}</span><ArrowRight size={16} /></Link>}
      </nav>
    </main>
  )
}
