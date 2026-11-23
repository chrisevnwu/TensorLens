import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { ArrowDown, ArrowRight, ArrowUp, CornerDownLeft, Search, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '../../i18n'
import { navigationText } from '../../i18n/navigation'
import { LAB_REGISTRY } from '../../labs/registry'
import { useAppStore } from '../../store/useAppStore'

interface Command {
  id: string
  title: string
  keywords: string
  detail?: string
  run: () => void
}

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
      id: lab.id, title: lab.title[locale],
      detail: common.chapters[lab.chapter],
      keywords: [lab.id, lab.title.en, lab.title.zh, ...lab.tags.en, ...lab.tags.zh,
        lab.description.en, lab.description.zh].join(' '),
      run: () => navigate('/labs/' + lab.id),
    }))
    const themeKey = theme === 'dark' ? 'light' : 'dark'
    const actions: Command[] = [
      { id: 'home', title: t.explore, keywords: 'home explorer explore labs 主页 总览 探索实验室', run: () => navigate('/') },
      { id: 'progress', title: t.progress, keywords: 'progress challenges 挑战进度', run: () => navigate('/?progress=1') },
      { id: 'theme', title: t[themeKey], keywords: 'theme ' + navigationText.en[themeKey] + navigationText.zh[themeKey], run: () => setTheme(themeKey) },
      { id: 'language', title: locale === 'en' ? t.chinese : t.english, keywords: 'English 中文 简体中文 language 语言', run: () => setLocale(locale === 'en' ? 'zh' : 'en') },
    ]
    return [...labs, ...actions.map(action => ({ ...action, detail: t.actions }))]
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
      if (previous instanceof HTMLElement) previous.focus()
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
          {results.map((command, index) => (
            <button key={command.id} type="button" role="option" tabIndex={-1} id={listId + '-' + command.id}
              aria-selected={index === selected} onPointerMove={event => { if (event.pointerType === 'mouse') setSelected(index) }}
              onClick={() => execute(command)}>
              <span><strong>{command.title}</strong><small>{command.detail}</small></span>
              <ArrowRight size={16} />
            </button>
          ))}
        </div>
        {!results.length && <p className="tl-empty-search" role="status">{t.noResults}</p>}
        <div className="tl-palette-keys" aria-hidden="true">
          <kbd><ArrowUp size={11} /></kbd><kbd><ArrowDown size={11} /></kbd> {t.move}
          <kbd><CornerDownLeft size={11} /></kbd> {t.open}
        </div>
      </div>
    </dialog>
  )
}
