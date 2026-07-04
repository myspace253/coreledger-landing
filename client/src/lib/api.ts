export interface RiskFactor {
  label: string
  score: number
}

export type DataQuality = 'live' | 'simulated' | 'unavailable'

export interface DataQualityMap {
  market: DataQuality
  developer: DataQuality
  social: DataQuality
  onchain: DataQuality
}

export interface MarketData {
  id: string
  symbol: string
  name: string
  image: string | null
  currentPriceUsd: number | null
  marketCapUsd: number | null
  marketCapRank: number | null
  fullyDilutedValuationUsd: number | null
  totalVolume24hUsd: number | null
  priceChangePct24h: number | null
  priceChangePct7d: number | null
  circulatingSupply: number | null
  totalSupply: number | null
  maxSupply: number | null
  athUsd: number | null
  athChangePct: number | null
  /** 7-day hourly price series in USD, oldest first. Null if unavailable. */
  sparkline7d: number[] | null
}

export interface DeveloperData {
  githubUrl: string | null
  stars: number | null
  forks: number | null
  subscribers: number | null
  totalIssues: number | null
  closedIssues: number | null
  pullRequestsMerged: number | null
  pullRequestContributors: number | null
  commitCount4Weeks: number | null
}

export interface SocialData {
  twitterFollowers: number | null
  twitterDataCaveat: string | null
  redditSubscribers: number | null
  telegramUsers: number | null
  sentimentUpPct: number | null
  sentimentDownPct: number | null
}

export interface ResearchReport {
  tokenQuery: string
  narrative: string
  category: string
  riskScore: number
  confidence: number
  recommendation: string
  marketCycle: string
  whaleActivity: string
  developerActivity: string
  holderHealth: string
  aiAnalysis: string
  verdict: string
  riskFactors: RiskFactor[]
  generatedAt: string
  /** @deprecated prefer dataQuality.onchain */
  dataSource: 'live' | 'mock'
  marketData: MarketData | null
  developerData: DeveloperData | null
  socialData: SocialData | null
  dataQuality: DataQualityMap
}

export interface ResearchResponse {
  report: ResearchReport
  usedFallback: boolean
  fallbackReason?: string
}

// Dev builds ALWAYS use a relative URL, regardless of what's in .env — the Vite
// proxy (see vite.config.ts) forwards /api/* to the Express server. This makes
// the app immune to a stale/misconfigured VITE_API_URL in a local .env file.
// Only a production build (`vite build`) will respect VITE_API_URL, since
// there's no dev proxy to fall back on once it's a static build.
const API_URL = import.meta.env.PROD ? import.meta.env.VITE_API_URL || '' : ''

export class ResearchApiError extends Error {
  /** True when the request never reached the server (offline, DNS, CORS, timeout). */
  isNetworkError: boolean

  constructor(message: string, isNetworkError = false) {
    super(message)
    this.isNetworkError = isNetworkError
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Status codes worth a silent retry — transient upstream/proxy issues rather
// than something the client did wrong. 4xx errors (bad query, validation) are
// never retried since retrying won't change the outcome.
const RETRYABLE_STATUS = new Set([502, 503, 504])
const MAX_ATTEMPTS = 3
const REQUEST_TIMEOUT_MS = 30_000

async function fetchOnce(query: string): Promise<Response> {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  try {
    return await fetch(`${API_URL}/api/research`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
      signal: controller.signal,
    })
  } finally {
    window.clearTimeout(timeout)
  }
}

export async function requestResearchReport(query: string): Promise<ResearchResponse> {
  let lastNetworkError: unknown

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let response: Response
    try {
      response = await fetchOnce(query)
    } catch (err) {
      lastNetworkError = err
      if (attempt < MAX_ATTEMPTS) {
        await sleep(500 * attempt)
        continue
      }
      const target = API_URL || 'the API (via the Vite dev proxy)'
      const aborted = err instanceof DOMException && err.name === 'AbortError'
      throw new ResearchApiError(
        aborted
          ? 'The request timed out. The server may be slow or unreachable — try again.'
          : `Can't reach ${target}. Is the server running? (npm run dev in /server, or npm run dev from the repo root)`,
        true
      )
    }

    if (!response.ok) {
      if (RETRYABLE_STATUS.has(response.status) && attempt < MAX_ATTEMPTS) {
        await sleep(500 * attempt)
        continue
      }
      const body = await response.json().catch(() => null)
      throw new ResearchApiError(body?.error || `Request failed with status ${response.status}.`)
    }

    return response.json()
  }

  // Unreachable in practice — the loop above always returns or throws — but
  // keeps TypeScript happy and gives a sane error if it ever is reached.
  throw new ResearchApiError(
    lastNetworkError instanceof Error ? lastNetworkError.message : 'Request failed after multiple attempts.',
    true
  )
}

export interface TrendingToken {
  id: string
  name: string
  symbol: string
  thumb: string | null
  marketCapRank: number | null
}

/**
 * Best-effort only — this powers the idle-screen suggestions, not a core
 * flow, so failures are swallowed and just result in an empty list (the
 * caller falls back to static examples) rather than surfacing an error.
 */
export async function fetchTrendingTokens(): Promise<TrendingToken[]> {
  try {
    const res = await fetch(`${API_URL}/api/trending`)
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data?.tokens) ? data.tokens : []
  } catch {
    return []
  }
}
