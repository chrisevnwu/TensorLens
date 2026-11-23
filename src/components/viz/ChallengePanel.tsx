import { Check, Circle } from 'lucide-react'
import { useI18n } from '../../i18n'
import { visuals } from '../../i18n/visuals'
import type { ChallengeStatus } from '../../labs/types'

export function ChallengePanel({ challenges }: { challenges: ChallengeStatus[] }) {
  const { locale } = useI18n()
  const t = visuals[locale]
  return <ol className="challenge-list">{challenges.map(item =>
    <li key={item.id} data-complete={item.completed}>
      <div className="challenge-heading">{item.completed ? <Check size={16} aria-label={t.complete} /> : <Circle size={13} aria-label={t.open} />}<strong>{item.title}</strong></div>
      <p>{item.description}</p>
      {item.completed && <details><summary>{t.insight}</summary><p>{item.insight}</p></details>}
    </li>)}</ol>
}
