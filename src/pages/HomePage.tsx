import { useEffect, useRef, useState } from 'react'
import { ArrowDown, ArrowRight, Check, ChevronDown, Cpu, FlaskConical, Layers3, SlidersHorizontal } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import AmbientField from '../components/viz/AmbientField'
import LabPreviewIcon from '../components/viz/LabPreviewIcon'
import { useI18n } from '../i18n'
import { homeCopy } from '../i18n/home'
import { CHAPTER_ORDER, LAB_REGISTRY, getLabById } from '../labs/registry'
import type { ChapterId, LabDifficulty } from '../labs/types'
import { useAppStore } from '../store/useAppStore'
import './home.css'

const totalLabs = LAB_REGISTRY.length
const totalChallenges = totalLabs * 3
const levels: readonly LabDifficulty[] = ['foundational', 'intermediate', 'advanced']
const roman = ['I', 'II', 'III', 'IV']

export default function HomePage() {
  const { common, locale } = useI18n()
  const copy = homeCopy[locale]
  const progress = useAppStore(state => state.completedChallenges)
  const lastLab = useAppStore(state => state.lastVisitedLabId)
  const resume = lastLab ? getLabById(lastLab) : undefined
  const [chapter, setChapter] = useState<ChapterId | 'all'>('all')
  const [difficulty, setDifficulty] = useState<LabDifficulty | 'all'>('all')
  const [params] = useSearchParams()
  const overview = params.get('progress') === '1'
  const catalogRef = useRef<HTMLElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const visibleLabs = LAB_REGISTRY.filter(lab =>
    (chapter === 'all' || chapter === lab.chapter) && (difficulty === 'all' || difficulty === lab.difficulty))
  const totalCompleted = LAB_REGISTRY.reduce((sum, lab) => sum + Math.min(3, progress[lab.id]?.length ?? 0), 0)

  function browse() {
    setChapter('all')
    setDifficulty('all')
    catalogRef.current?.scrollIntoView({ block: 'start' })
    headingRef.current?.focus({ preventScroll: true })
  }

  useEffect(() => {
    if (overview) {
      catalogRef.current?.scrollIntoView?.({ block: 'start' })
      headingRef.current?.focus({ preventScroll: true })
    }
  }, [overview])

  return <main className="home-page">
    <section className="home-hero" aria-labelledby="home-title">
      <div className="home-hero-copy">
        <h1 id="home-title">{copy.title}<br /><span>{copy.titleAccent}</span></h1>
        <p>{copy.intro}</p>
        <div className="hero-actions">
          <Link className="hero-start" to={`/labs/${resume?.id ?? 'bpe-tokenizer'}`}>
            {resume ? `${copy.resume} ${String(resume.number).padStart(2, '0')}` : copy.start}
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
          <button className="hero-browse" onClick={browse}>{copy.browse.replace('{count}', String(totalLabs))}<ArrowDown size={15} aria-hidden="true" /></button>
        </div>
      </div>
      <div className="hero-field" aria-hidden="true"><AmbientField /></div>
    </section>

    <dl className="hero-stats">
      {[
        { Icon: Layers3, label: copy.labStat, value: totalLabs },
        { Icon: FlaskConical, label: copy.challengeStat, value: totalChallenges },
        { Icon: Cpu, label: copy.mathStat, value: '100%' },
      ].map(({ Icon, value, label }) => <div key={label}>
        <Icon size={19} strokeWidth={1.5} aria-hidden="true" />
        <dt>{label}</dt><dd>{value}</dd>
      </div>)}
    </dl>

    <section className="home-catalog" id="catalog" ref={catalogRef} aria-labelledby="catalog-heading">
      <div className="catalog-line">
        <h2 tabIndex={-1} ref={headingRef} id="catalog-heading">{copy.catalog}</h2>
        <label className="difficulty-select">
          <SlidersHorizontal size={14} aria-hidden="true" />
          <select aria-label={copy.difficulty} value={difficulty}
            onChange={event => setDifficulty(levels.find(level => level === event.target.value) ?? 'all')}>
            <option value="all">{copy.anyDifficulty}</option>
            {levels.map(level => <option value={level} key={level}>{common.difficulties[level]}</option>)}
          </select>
          <ChevronDown size={13} aria-hidden="true" />
        </label>
      </div>
      {overview && <div className="catalog-progress">
        <strong>{copy.achievements}</strong>
        <progress aria-label={copy.achievements} value={totalCompleted} max={totalChallenges} />
        <span>{totalCompleted}/{totalChallenges}</span>
      </div>}
      <div role="group" aria-label={copy.chapter} className="catalog-filters">
        <button aria-pressed={chapter === 'all'} onClick={() => setChapter('all')}>{copy.all}</button>
        {CHAPTER_ORDER.map((id, index) => <button key={id} aria-pressed={chapter === id} onClick={() => setChapter(id)}>
          <span className="chapter-numeral">{roman[index]}</span> {common.chapters[id]}
        </button>)}
      </div>

      <div className="catalog-grid">
        {visibleLabs.map(lab => {
          const completed = Math.min(3, progress[lab.id]?.length ?? 0)
          return <Link className="lab-card" data-tone={(lab.number - 1) % 5} to={`/labs/${lab.id}`} key={lab.id}>
            <div className="lab-card-figure">
              <span className="lab-index">{copy.lab} {String(lab.number).padStart(2, '0')}</span>
              <span className="level-label" data-level={lab.difficulty}>{common.difficulties[lab.difficulty]}</span>
              <LabPreviewIcon id={lab.id} />
            </div>
            <div className="lab-card-copy">
              <h3>{lab.title[locale]}</h3>
              <p>{lab.description[locale]}</p>
              <div className="lab-card-foot">
                <div className="lab-tags">{lab.tags[locale].slice(0, 3).map(tag => <span key={tag}>{tag}</span>)}</div>
                <span className="lab-completion" title={copy.achievements} aria-label={`${copy.achievements} ${completed}/3`}>
                  <Check size={12} aria-hidden="true" />{completed}/3
                </span>
              </div>
            </div>
          </Link>
        })}
      </div>
      {visibleLabs.length === 0 && <div className="catalog-empty" role="status">
        <p>{copy.empty}</p><button onClick={browse}>{copy.clear}</button>
      </div>}
    </section>
  </main>
}
