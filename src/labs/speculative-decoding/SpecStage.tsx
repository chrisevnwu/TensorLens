import { distributions, oneStepLaw, OUTPUT_LENGTH, TOKENS, type Block } from '../../engine/labs/speculative-decoding/engine'
import { useI18n } from '../../i18n'
import { speculativeCopy } from '../../i18n/labs/speculative-decoding'
import type { State } from './config'
import './speculative.css'

function percent(p: number) {
  return Number((100 * p).toFixed(1)) + '%'
}

export function SpecStage({ state, block, start, select }: {
  state: State; block: Block; start: number; select: (slot: number) => void
}) {
  const { locale } = useI18n()
  const t = speculativeCopy[locale]
  const selected = block.proposals[state.slot]
  const context = selected?.context ?? block.tailContext
  const { target, draft } = distributions(context, state.mismatch)
  const law = oneStepLaw(target, draft)
  const cards = [...block.proposals.map((p, i) => ({
    token: p.token, label: t.proposal.replace('{n}', String(i + 1)), status: p.status,
  })), { token: block.tailToken, label: t.target, status: block.tailKind }]
  const rows = [[t.draft, draft], [t.target, target], [t.residual, law.residual]] as const

  return <div className="spec-stage">
    <section>
      <div className="spec-heading"><h2>{t.output}</h2><span>{block.output.length} / {OUTPUT_LENGTH}</span></div>
      <div className="spec-tape" aria-label={t.output}>
        {Array.from({ length: OUTPUT_LENGTH }, (_, i) => <span key={i}
          className={i >= block.output.length ? 'spec-empty' : i >= start ? 'spec-current' : ''}>
          {block.output[i] ?? '·'}
        </span>)}
      </div>
    </section>
    <section className="spec-block">
      <div className="spec-heading"><h2>{t.call.replace('{n}', String(state.step + 1))}</h2></div>
      <div className="spec-cards" role="group" aria-label={t.outcomes}>
        {cards.map((card, i) => <button type="button" key={i} data-status={card.status}
          aria-pressed={state.slot === i} onClick={() => select(i)}>
          <small>{card.label}</small><strong>{card.token}</strong><span>{t.statuses[card.status]}</span>
        </button>)}
      </div>
      <div className="spec-detail">
        {selected ? selected.draw === null ? t.skipped :
          <>{t.threshold}<code>u = {selected.draw.toFixed(4)} · α = {selected.threshold.toFixed(4)}</code></>
          : block.tailKind === 'bonus' ? t.extra : block.tailKind === 'direct' ? t.final : t.corrected}
      </div>
    </section>
    <section className="spec-law">
      <h2>{t.law.replace('{token}', context)}</h2>
      <table>
        <thead><tr><th scope="col">{t.token}</th>{TOKENS.map(token => <th scope="col" key={token}>{token}</th>)}</tr></thead>
        <tbody>{rows.map(([label, weights]) => <tr key={label}><th scope="row">{label}</th>
          {label === t.residual && !law.rejection ? <td colSpan={3}>{t.impossible}</td> :
            weights.map((weight, i) => <td key={i}>{percent(weight)}</td>)}
        </tr>)}
        <tr className="spec-final"><th scope="row">{t.combined}</th>{TOKENS.map((token, i) =>
          <td key={token}>{percent(law.output[i]!)}
            <svg width="100%" height="6" viewBox="0 0 100 6" preserveAspectRatio="none" aria-hidden="true">
              <rect width="100" height="6" fill="var(--bg-elevated)" />
              <rect width={100 * law.acceptedMass[i]!} height="6" fill="var(--accent-primary)" />
              <rect x={100 * law.acceptedMass[i]!} width={100 * law.rejection * law.residual[i]!} height="6" fill="var(--accent-secondary)" />
            </svg>
          </td>)}</tr></tbody>
      </table>
      <div className="spec-legend"><span>{t.legend}</span><span>{t.repair}</span></div>
    </section>
  </div>
}
