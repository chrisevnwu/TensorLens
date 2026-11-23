import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { ArrowDown, ArrowRight, ArrowUp, CornerDownLeft, FlaskConical, Search, SlidersHorizontal, Terminal, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '../../i18n'
import { navigationText } from '../../i18n/navigation'
import { getLabPresets } from '../../labs/presetCatalog'
import { LAB_REGISTRY } from '../../labs/registry'
import { useAppStore } from '../../store/useAppStore'

interface Command {
  id: string
  title: string
  kind: 'lab' | 'preset' | 'action'
  keywords: string
  detail?: string
  run: () => void
}

const commandIcons = { lab: FlaskConical, preset: SlidersHorizontal, action: Terminal }

function score(text: string, query: string) {
  const source = text.normalize('NFKC').toLowerCase()
  let total = 0
  for (const term of query.normalize('NFKC').toLowerCase().trim().split(/\s+/)) {
    if (!term) continue
    const exact = source.indexOf(term)
    if (exact >= 0) {
      total += 2 + term.length / (1 + exact)
      continue
    }
    let previous = -1
    let first = -1
    for (const char of term) {
      previous = source.indexOf(char, previous + 1)
      if (previous === -1) return -1
      if (first === -1) first = previous
    }
    total += term.length / (1 + previous - first)
  }
  return total
}

export default function CommandPalette({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const modal = useRef<HTMLDialogElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const options = useRef<HTMLDivElement>(null)
  const listId = useId()
  const { locale, setLocale, common } = useI18n()
  const theme = useAppStore(state => state.theme)
  const setTheme = useAppStore(state => state.setTheme)
  const navigate = useNavigate()
  const t = navigationText[locale]
  const commands = useMemo(() => {
    const labs: Command[] = LAB_REGISTRY.map(lab => ({
      id: lab.id, kind: 'lab', title: lab.title[locale],
      detail: common.chapters[lab.chapter],
      keywords: [lab.id, lab.title.en, lab.title.zh, ...lab.tags.en, ...lab.tags.zh,
        lab.description.en, lab.description.zh, 'Lab ' + String(lab.number).padStart(2, '0'), '实验 ' + String(lab.number).padStart(2, '0')].join(' '),
      run: () => navigate('/labs/' + lab.id),
    }))
    const presets: Command[] = LAB_REGISTRY.flatMap(lab => getLabPresets(lab.id).map(preset => ({
      id: lab.id + '-' + preset.id, kind: 'preset' as const, title: preset.title[locale], detail: lab.title[locale],
      keywords: [preset.title.en, preset.title.zh, preset.id, lab.id, lab.title.en, lab.title.zh].join(' '),
      run: () => navigate('/labs/' + lab.id + '?preset=' + encodeURIComponent(preset.id)),
    })))
    const themeKey = theme === 'dark' ? 'light' : 'dark'
    const actions: Command[] = [
      { id: 'home', kind: 'action', title: t.explore, keywords: 'home explorer explore labs 主页 总览 探索实验室', run: () => navigate('/') },
      { id: 'progress', kind: 'action', title: t.progress, keywords: 'progress challenges 挑战进度', run: () => navigate('/?progress=1') },
      { id: 'theme', kind: 'action', title: t[themeKey], keywords: 'theme ' + navigationText.en[themeKey] + navigationText.zh[themeKey], run: () => setTheme(themeKey) },
      { id: 'language', kind: 'action', title: locale === 'en' ? t.chinese : t.english, keywords: 'English 中文 简体中文 language 语言', run: () => setLocale(locale === 'en' ? 'zh' : 'en') },
    ]
    return [...labs, ...actions.map(action => ({ ...action, detail: t.actions })), ...presets]
  }, [common, locale, navigate, setLocale, setTheme, t, theme])

  const results = useMemo(() => commands
    .map(command => ({ command, score: score(command.title + ' ' + command.keywords, query) }))
    .filter(result => result.score >= 0)
    .sort((a, b) => b.score - a.score)
    .map(result => result.command), [commands, query])
  const current = results[selected]

  useEffect(() => {
    const dialog = modal.current
    const previous = document.activeElement
    if (!dialog) return
    dialog.showModal()
    input.current?.focus()
    return () => {
      dialog.close()
      if (previous instanceof HTMLElement) previous.focus({ preventScroll: true })
    }
  }, [])

  useEffect(() => {
    options.current?.children[selected]?.scrollIntoView({ block: 'nearest' })
  }, [selected])

  function execute(command: Command) {
    onClose()
    command.run()
  }

  return (
    <dialog ref={modal} className="tl-palette" aria-label={t.palette}
      onCancel={event => { event.preventDefault(); onClose() }}
      onClick={event => { if (event.target === modal.current) onClose() }}>
      <div className="tl-palette-content">
        <div className="tl-palette-search">
          <Search size={20} />
          <input ref={input} role="combobox" aria-expanded="true" aria-autocomplete="list" aria-label={t.search}
            aria-controls={listId} aria-activedescendant={current ? listId + '-' + current.id : undefined}
            value={query} placeholder={t.search}
            onChange={event => { setQuery(event.target.value); setSelected(0) }}
            onKeyDown={event => {
              if (event.nativeEvent.isComposing || !results.length) return
              if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                event.preventDefault()
                const delta = event.key === 'ArrowDown' ? 1 : -1
                setSelected(index => (index + results.length + delta) % results.length)
              } else if (event.key === 'Enter' && current) {
                event.preventDefault()
                execute(current)
              }
            }} />
          <button type="button" onClick={onClose} aria-label={t.close}><X size={17} /></button>
        </div>
        <div className="tl-command-list" role="listbox" aria-label={t.search} id={listId} ref={options}>
          {results.map((command, index) => {
            const Icon = commandIcons[command.kind]
            return <button key={command.id} type="button" role="option" tabIndex={-1} id={listId + '-' + command.id}
              aria-selected={index === selected} onPointerMove={event => { if (event.pointerType === 'mouse') setSelected(index) }}
              onClick={() => execute(command)}>
              <Icon size={17} className="tl-command-icon" aria-hidden="true" />
              <span><strong>{command.title}</strong><small>{command.detail}</small></span>
              <ArrowRight size={16} className="tl-command-arrow" aria-hidden="true" />
            </button>
          })}
        </div>
        {!results.length && <div className="tl-empty-search">
          <p role="status">{t.noResults}</p>
          <button type="button" onClick={() => { setQuery(''); input.current?.focus() }}>{t.clearSearch}</button>
        </div>}
        {results.length > 0 && <div className="tl-palette-keys" aria-hidden="true">
          <kbd><ArrowUp size={11} /></kbd><kbd><ArrowDown size={11} /></kbd> {t.move}
          <kbd><CornerDownLeft size={11} /></kbd> {t.open}
        </div>}
      </div>
    </dialog>
  )
}
