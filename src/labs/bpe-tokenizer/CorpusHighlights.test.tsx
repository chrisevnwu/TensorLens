import '@testing-library/jest-dom/vitest'
import { cleanup, render } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import { CorpusHighlights } from './CorpusHighlights'

afterEach(cleanup)

it('marks only the merged bytes when a pair cuts into multibyte text', () => {
  // 你 = E4 BD A0. The pair contains A0 + the following ASCII exclamation mark.
  const {container} = render(<CorpusHighlights corpus="你! 好" occurrences={[{start: 2, end: 4}]} fragmentHint="UTF-8" />)
  expect([...container.querySelectorAll('mark')].map(item => item.textContent).join('')).toBe('<0xA0>!')
  expect(container.querySelector('pre')?.textContent).toBe('<0xE4><0xBD><0xA0>! 好')
})

it('preserves intact emoji when a merged occurrence aligns with complete scalars', () => {
  const {container} = render(<CorpusHighlights corpus="a🚀b" occurrences={[{start: 1, end: 5}]} fragmentHint="UTF-8" />)
  expect(container.querySelector('mark')).toHaveTextContent('🚀')
  expect(container.querySelector('pre')?.textContent).toBe('a🚀b')
})
