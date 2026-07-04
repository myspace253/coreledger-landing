import { describe, expect, it } from 'vitest'
import { addRecentSearch, clearRecentSearches, getRecentSearches } from '../searchHistory'

// These tests run in vitest's default Node environment (no `window`/`localStorage`),
// which doubles as a check that the module degrades gracefully outside a browser
// (e.g. if it were ever imported during SSR or a build step) instead of throwing.
describe('searchHistory (no window/localStorage available)', () => {
  it('getRecentSearches returns an empty array rather than throwing', () => {
    expect(getRecentSearches()).toEqual([])
  })

  it('addRecentSearch does not throw and returns an array', () => {
    expect(() => addRecentSearch('PEPE')).not.toThrow()
    expect(Array.isArray(addRecentSearch('PEPE'))).toBe(true)
  })

  it('clearRecentSearches does not throw', () => {
    expect(() => clearRecentSearches()).not.toThrow()
  })
})
