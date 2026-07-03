import type { OnchainSnapshot, ResearchReport } from '../types.js'

const SYSTEM_PROMPT = `You are an on-chain investment research analyst. You are given a
structured data snapshot for a crypto token. Reason over the data and return ONLY a
single JSON object (no markdown fences, no prose outside the JSON) matching exactly
this shape:

{
  "narrative": string,            // e.g. "AI Infrastructure", "DePIN", "RWA"
  "category": string,             // sector classification
  "riskScore": number,            // 0-100 overall risk score, higher = safer
  "confidence": number,           // 0-100 AI confidence in this assessment
  "recommendation": string,       // one short phrase, e.g. "Accumulation zone"
  "marketCycle": string,          // e.g. "Early accumulation", "Distribution"
  "whaleActivity": string,        // one sentence describing whale/smart-money behavior
  "developerActivity": string,    // one sentence describing dev activity
  "holderHealth": string,         // one sentence on distribution risk
  "aiAnalysis": string,           // 2-3 sentence narrative synthesis, plain English
  "verdict": string,              // one short closing verdict phrase
  "riskFactors": [ { "label": string, "score": number } ]  // 5-7 factors, 0-100 each
}

Be concrete and reference the specific numbers you were given. Do not invent facts
that aren't implied by the data snapshot. If the data snapshot is marked as mock/demo
data, still produce a fully-formed report but do not claim it reflects live markets.`

function buildUserPrompt(query: string, snapshot: OnchainSnapshot) {
  return `Token query: ${query}

Data snapshot (${snapshot.isMockData ? 'DEMO DATA — not live' : 'live data'}):
- Top holder concentration: ${snapshot.topHolderConcentrationPct}%
- Whale net accumulation (30d): ${snapshot.whaleNetAccumulation30dPct}%
- Liquidity locked: ${snapshot.liquidityLockedPct}%
- GitHub commits (30d): ${snapshot.githubCommits30d}
- Active contributors: ${snapshot.activeContributors}
- Contract flags: ${snapshot.contractFlags.length ? snapshot.contractFlags.join(', ') : 'none detected'}

Return the JSON report now.`
}

function safeParseReportJson(raw: string): Record<string, unknown> {
  const cleaned = raw.trim().replace(/^```json\s*/i, '').replace(/```$/, '')
  return JSON.parse(cleaned)
}

export function synthesizeFallbackReport(query: string, snapshot: OnchainSnapshot): ResearchReport {
  const accumulating = snapshot.whaleNetAccumulation30dPct > 3
  const concentrationRisk = snapshot.topHolderConcentrationPct > 45
  const devHealthy = snapshot.githubCommits30d > 80 && snapshot.activeContributors > 5

  const riskFactors = [
    { label: 'Smart Contract', score: snapshot.contractFlags.length ? 62 : 92 },
    { label: 'Liquidity', score: Math.min(98, snapshot.liquidityLockedPct + 5) },
    { label: 'Developer Activity', score: devHealthy ? 90 : 58 },
    { label: 'Holder Distribution', score: Math.max(20, 100 - snapshot.topHolderConcentrationPct) },
    { label: 'Whale Risk', score: accumulating ? 74 : 55 },
  ]
  const overall = Math.round(riskFactors.reduce((s, f) => s + f.score, 0) / riskFactors.length)

  return {
    tokenQuery: query,
    narrative: 'Unclassified (offline mode)',
    category: 'General',
    riskScore: overall,
    confidence: 55,
    recommendation: accumulating ? 'Watchlist — accumulation signal' : 'Neutral',
    marketCycle: accumulating ? 'Early accumulation' : 'Range-bound',
    whaleActivity: accumulating
      ? `Large wallets grew holdings by roughly ${snapshot.whaleNetAccumulation30dPct}% over 30 days.`
      : `No meaningful net accumulation detected over 30 days (${snapshot.whaleNetAccumulation30dPct}%).`,
    developerActivity: devHealthy
      ? `${snapshot.githubCommits30d} commits from ${snapshot.activeContributors} contributors in the last 30 days — active development.`
      : `Only ${snapshot.githubCommits30d} commits from ${snapshot.activeContributors} contributors in 30 days — development pace is light.`,
    holderHealth: concentrationRisk
      ? `Top holders control ${snapshot.topHolderConcentrationPct}% of supply — concentration risk is elevated.`
      : `Top holders control ${snapshot.topHolderConcentrationPct}% of supply — distribution looks reasonably healthy.`,
    aiAnalysis:
      `This is a locally-generated fallback report — no AI_API_KEY is configured yet, so an LLM did not ` +
      `reason over this data. Set AI_BASE_URL / AI_API_KEY in server/.env to get full narrative analysis.`,
    verdict: 'Configure an AI provider for a full narrative verdict.',
    riskFactors,
    generatedAt: new Date().toISOString(),
    dataSource: snapshot.isMockData ? 'mock' : 'live',
  }
}

export async function generateResearchReport(
  query: string,
  snapshot: OnchainSnapshot
): Promise<ResearchReport> {
  const baseUrl = process.env.AI_BASE_URL
  const apiKey = process.env.AI_API_KEY
  const model = process.env.AI_MODEL || 'minimax-m3'

  if (!baseUrl || !apiKey) {
    throw new Error(
      'AI_BASE_URL / AI_API_KEY are not set. Copy server/.env.example to server/.env and add your provider key.'
    )
  }

  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt(query, snapshot) },
      ],
    }),
  })

  if (!response.ok) {
    const errText = await response.text().catch(() => '')
    throw new Error(`AI provider error (${response.status}): ${errText.slice(0, 500)}`)
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[]
  }
  const content = data.choices?.[0]?.message?.content
  if (!content) throw new Error('AI provider returned an empty response.')

  const parsed = safeParseReportJson(content)

  return {
    tokenQuery: query,
    narrative: String(parsed.narrative ?? 'Unclassified'),
    category: String(parsed.category ?? 'Unclassified'),
    riskScore: Number(parsed.riskScore ?? 0),
    confidence: Number(parsed.confidence ?? 0),
    recommendation: String(parsed.recommendation ?? ''),
    marketCycle: String(parsed.marketCycle ?? ''),
    whaleActivity: String(parsed.whaleActivity ?? ''),
    developerActivity: String(parsed.developerActivity ?? ''),
    holderHealth: String(parsed.holderHealth ?? ''),
    aiAnalysis: String(parsed.aiAnalysis ?? ''),
    verdict: String(parsed.verdict ?? ''),
    riskFactors: Array.isArray(parsed.riskFactors)
      ? (parsed.riskFactors as { label: string; score: number }[])
      : [],
    generatedAt: new Date().toISOString(),
    dataSource: snapshot.isMockData ? 'mock' : 'live',
  }
}
