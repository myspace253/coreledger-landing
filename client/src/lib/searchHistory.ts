// Recent-searches list backed by localStorage. This is a real Vite app (not
// the Artifacts sandbox), so browser storage APIs work normally here — this
// is purely local convenience state, never sent to the server.

const STORAGE_KEY = 'coreledger:recent-searches'
const MAX_ITEMS = 8

export interface RecentSearch {
  query: string
  timestamp: number
}

function isStorageAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

export function getRecentSearches(): RecentSearch[] {
  if (!isStorageAvailable()) return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as RecentSearch[]) : []
  } catch {
    // Corrupt or inaccessible storage (private browsing, quota) — degrade to no history.
    return []
  }
}

export function addRecentSearch(query: string): RecentSearch[] {
  const trimmed = query.trim()
  if (!trimmed || !isStorageAvailable()) return getRecentSearches()

  const deduped = getRecentSearches().filter((s) => s.query.toLowerCase() !== trimmed.toLowerCase())
  const next = [{ query: trimmed, timestamp: Date.now() }, ...deduped].slice(0, MAX_ITEMS)

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // Storage full or unavailable — the in-memory `next` is still returned
    // to the caller so the UI updates for this session even if it won't persist.
  }
  return next
}

export function clearRecentSearches(): void {
  if (!isStorageAvailable()) return
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}
