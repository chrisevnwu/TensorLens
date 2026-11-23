import { lazy, Suspense, useEffect, useState } from 'react'
import { ChevronDown, Github, Layers3, Moon, Search, Sun } from 'lucide-react'
import { Link, useLocation, useMatch, useNavigate } from 'react-router-dom'
import { useI18n } from '../../i18n'
import { navigationText } from '../../i18n/navigation'
import { LAB_REGISTRY } from '../../labs/registry'
import { useAppStore } from '../../store/useAppStore'

const CommandPalette = lazy(() => import('./CommandPalette'))

function Logo() {
  return (
    <svg viewBox="0 0 32 32" width="30" height="30" aria-hidden="true" fill="none">
      <path d="m16 2 13 7.5v13L16 30 3 22.5v-13z" stroke="currentColor" strokeWidth="1.7" />
      <path d="m3 9.5 13 7.4 13-7.4M16 17v13M9.5 6l13 7.4v7L16 24" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

export default function AppHeader() {
  const [open, setOpen] = useState(false)
  const { locale, setLocale, common } = useI18n()
  const copy = navigationText[locale]
  const theme = useAppStore(state => state.theme)
  const setTheme = useAppStore(state => state.setTheme)
  const completed = useAppStore(state => state.completedChallenges)
  const total = LAB_REGISTRY.length * 3
  const count = LAB_REGISTRY.reduce((sum, lab) => sum + Math.min(3, new Set(completed[lab.id]).size), 0)
  const match = useMatch('/labs/:labId')
  const navigate = useNavigate()
  const location = useLocation()
  const repo = import.meta.env.VITE_REPOSITORY_URL as string | undefined
  const themeLabel = theme === 'dark' ? copy.light : copy.dark

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen(value => !value)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  useEffect(() => setOpen(false), [location.pathname, location.search])

  return (
    <header className="tl-header">
      <nav className="tl-nav" aria-label={copy.explore}>
        <Link className="tl-brand" to="/" aria-label="TensorLens"><Logo /><span>TensorLens</span></Link>
        <span className="tl-nav-divider" aria-hidden="true" />
        <div className="tl-switch">
          <Layers3 size={16} aria-hidden="true" />
          <span>{LAB_REGISTRY.find(lab => lab.id === match?.params.labId)?.title[locale] ?? copy.explore}</span>
          <ChevronDown size={13} aria-hidden="true" />
          <select aria-label={copy.switchLab} value={match?.params.labId ?? ''} onChange={event => navigate(event.target.value ? '/labs/' + event.target.value : '/')}>
            <option value="">{copy.explore}</option>
            {LAB_REGISTRY.map(lab => <option key={lab.id} value={lab.id}>{String(lab.number).padStart(2, '0')} · {lab.title[locale]} — {common.chapters[lab.chapter]}</option>)}
          </select>
        </div>
        <div className="tl-nav-tools">
          <button type="button" className="tl-search-trigger" aria-label={copy.palette} title={copy.palette} aria-haspopup="dialog" onClick={() => setOpen(true)}>
            <Search size={15} /><span>{copy.searchShort}</span><kbd>⌘ K</kbd>
          </button>
          <Link className="tl-progress-link" to="/?progress=1" title={copy.progress} aria-label={copy.progress + ' ' + count + '/' + total}>
            <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
              <circle cx="10" cy="10" r="7" fill="none" stroke="var(--border-strong)" strokeWidth="2.5" />
              <circle cx="10" cy="10" r="7" fill="none" stroke="var(--accent-tertiary)" strokeWidth="2.5" pathLength="1" strokeDasharray={count / total + ' 1'} transform="rotate(-90 10 10)" />
            </svg><span>{count}/{total}</span>
          </Link>
          <div className="tl-languages">
            <button type="button" aria-label="English" lang="en" aria-pressed={locale === 'en'} onClick={() => setLocale('en')}>EN</button>
            <button type="button" aria-label="简体中文" lang="zh-CN" aria-pressed={locale === 'zh'} onClick={() => setLocale('zh')}>中文</button>
          </div>
          <button type="button" className="tl-icon-btn" aria-label={themeLabel} title={themeLabel} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <a className="tl-icon-btn" aria-label={repo ? copy.source : copy.searchSource} title={repo ? copy.source : copy.searchSource}
            href={repo || 'https://github.com/search?q=TensorLens&type=repositories'} target="_blank" rel="noreferrer"><Github size={17} /></a>
        </div>
      </nav>
      {open && <Suspense fallback={null}><CommandPalette onClose={() => setOpen(false)} /></Suspense>}
    </header>
  )
}
