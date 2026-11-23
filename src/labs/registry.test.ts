import { expect, it } from 'vitest'
import { CHAPTER_ORDER, LAB_REGISTRY, getAdjacentLabs, getLabById } from './registry'

it('resolves every numbered curriculum route and its neighbors in reading order', () => {
  expect(LAB_REGISTRY).toHaveLength(15)
  expect(new Set(LAB_REGISTRY.map((lab) => lab.id)).size).toBe(LAB_REGISTRY.length)
  expect([...new Set(LAB_REGISTRY.map((lab) => lab.chapter))]).toEqual(CHAPTER_ORDER)
  for (const [index, lab] of LAB_REGISTRY.entries()) {
    expect(lab.number).toBe(index + 1)
    expect(lab.id).toMatch(/^[a-z]+(-[a-z]+)*$/)
    expect(getLabById(lab.id)).toBe(lab)
    expect(getAdjacentLabs(lab.id)).toEqual({ previous: LAB_REGISTRY[index - 1], next: LAB_REGISTRY[index + 1] })
  }
  expect(getLabById('unknown')).toBeUndefined()
  expect(getAdjacentLabs('unknown')).toEqual({ previous: undefined, next: undefined })
})
