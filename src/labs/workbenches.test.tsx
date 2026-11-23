import '@testing-library/jest-dom/vitest'
import { Suspense } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import { LAB_REGISTRY } from './registry'
import { useAppStore } from '../store/useAppStore'

afterEach(cleanup)
for (const lab of LAB_REGISTRY) {
  const Workbench = lab.component
  if (!Workbench) continue
  it.each(['en', 'zh'] as const)(lab.id + ' opens a functioning %s workbench', async locale => {
    history.replaceState(null, '', '/#/labs/' + lab.id)
    useAppStore.setState({ locale, completedChallenges:{} })
    render(<MemoryRouter><Suspense><Workbench /></Suspense></MemoryRouter>)
    expect(await screen.findByRole('heading', { name:lab.title[locale], level:1 })).toBeVisible()
    const main = screen.getByRole('main')
    const shareLabel = locale === 'en' ? 'Share URL' : '分享链接'
    expect(within(main).getByRole('button', { name:shareLabel })).toBeEnabled()
    expect(main.querySelectorAll('.challenge-list > li')).toHaveLength(3)
    expect(main.querySelectorAll('.metric-card output').length).toBeGreaterThanOrEqual(4)
  })
}
