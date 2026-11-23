import { cleanup, render } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import { MatrixHeatmap } from '../MatrixHeatmap'
import { divergingColor } from '../../../engine/math/colormaps'
import { useAppStore } from '../../../store/useAppStore'

afterEach(cleanup)
it('keeps the finite color domain intact in a masked row and marks the excluded cell', () => {
  useAppStore.setState({ theme:'dark' })
  const { container } = render(<MatrixHeatmap label="QK" values={[[2, -2, -Infinity]]} signed />)
  const cells = [...container.querySelectorAll('rect')].filter(cell => cell.querySelector('title'))
  expect(cells.map(cell => cell.getAttribute('fill'))).toEqual([
    divergingColor(2, 2, 'dark'), divergingColor(-2, 2, 'dark'), expect.stringMatching(/^url\(#/),
  ])
})
