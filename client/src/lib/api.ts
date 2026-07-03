export interface RiskFactor {
  label: string
  score: number
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
  dataSource: 'live' | 'mock'
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

export class ResearchApiError extends Error {}

export async function requestResearchReport(query: string): Promise<ResearchResponse> {
  let response: Response
  try {
    response = await fetch(`${API_URL}/api/research`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    })
  } catch {
    const target = API_URL || 'the API (via the Vite dev proxy)'
    throw new ResearchApiError(
      `Can't reach ${target}. Is the server running? (npm run dev in /server, or npm run dev from the repo root)`
    )
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new ResearchApiError(body?.error || `Request failed with status ${response.status}.`)
  }

  return response.json()
}
