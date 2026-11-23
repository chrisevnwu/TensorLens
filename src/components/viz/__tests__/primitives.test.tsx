import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import { FormulaBar } from '../FormulaBar'
import { ChallengePanel } from '../ChallengePanel'

afterEach(cleanup)
it('typesets live expressions with accessible MathML', () => {
  const { container, rerender } = render(<FormulaBar tex={'a^2 = 4'} />)
  expect(container.querySelector('math')?.namespaceURI).toBe('http://www.w3.org/1998/Math/MathML')
  rerender(<FormulaBar tex={'a^2 = 9'} />)
  expect(container.querySelector('annotation')?.textContent).toBe('a^2 = 9')
})
it('explains completed challenges and keeps further insights hidden', () => {
  const challenge = { id: '1', title: 'Rotate', description: 'Shift both.', insight: 'The dot product is invariant.', completed: false }
  const { rerender } = render(<ChallengePanel challenges={[challenge]} />)
  expect(screen.queryByText(challenge.insight)).toBeNull()
  rerender(<ChallengePanel challenges={[{ ...challenge, completed: true }]} />)
  expect(screen.getByText(challenge.insight)).toBeInTheDocument()
})
