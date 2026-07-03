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
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787'

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
    throw new ResearchApiError(
      `Can't reach the research API at ${API_URL}. Is the server running (npm run dev in /server)?`
    )
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new ResearchApiError(body?.error || `Request failed with status ${response.status}.`)
  }

  return response.json()
}
