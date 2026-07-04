import type { ResearchReport } from './api'

function fmtUsd(value: number | null): string {
  if (value === null) return 'n/a'
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 6 })
}

function fmtNum(value: number | null): string {
  return value === null ? 'n/a' : value.toLocaleString('en-US')
}

export function reportToMarkdown(report: ResearchReport): string {
  const lines: string[] = []
  lines.push(`# Coreledger report — ${report.tokenQuery}`)
  lines.push(`_Generated ${new Date(report.generatedAt).toLocaleString()}_`)
  lines.push('')
  lines.push('## Summary')
  lines.push(`- Narrative: ${report.narrative}`)
  lines.push(`- Category: ${report.category}`)
  lines.push(`- Risk score: ${report.riskScore}/100`)
  lines.push(`- Confidence: ${report.confidence}%`)
  lines.push(`- Market cycle: ${report.marketCycle}`)
  lines.push(`- Recommendation: ${report.recommendation}`)
  lines.push('')

  if (report.marketData) {
    const m = report.marketData
    lines.push(`## Market snapshot (${report.dataQuality.market})`)
    lines.push(`- Price: ${fmtUsd(m.currentPriceUsd)} (24h: ${m.priceChangePct24h?.toFixed(2) ?? 'n/a'}%)`)
    lines.push(`- Market cap: ${fmtUsd(m.marketCapUsd)} (rank ${m.marketCapRank ?? 'n/a'})`)
    lines.push(`- 24h volume: ${fmtUsd(m.totalVolume24hUsd)}`)
    lines.push(`- Circulating supply: ${fmtNum(m.circulatingSupply)}`)
    lines.push('')
  }

  if (report.developerData) {
    const d = report.developerData
    lines.push(`## Developer activity (${report.dataQuality.developer})`)
    lines.push(`- Commits (4wk): ${fmtNum(d.commitCount4Weeks)}`)
    lines.push(`- Stars / forks: ${fmtNum(d.stars)} / ${fmtNum(d.forks)}`)
    lines.push(`- Merged PRs: ${fmtNum(d.pullRequestsMerged)} from ${fmtNum(d.pullRequestContributors)} contributors`)
    lines.push('')
  }

  if (report.socialData) {
    const s = report.socialData
    lines.push(`## Social (${report.dataQuality.social})`)
    lines.push(
      `- Twitter/X followers: ${fmtNum(s.twitterFollowers)}${s.twitterDataCaveat ? ` (⚠️ ${s.twitterDataCaveat})` : ''}`
    )
    lines.push(`- Reddit subscribers: ${fmtNum(s.redditSubscribers)}`)
    lines.push(`- Sentiment: ${s.sentimentUpPct ?? 'n/a'}% up / ${s.sentimentDownPct ?? 'n/a'}% down`)
    lines.push('')
  }

  lines.push(`## Risk factors`)
  for (const f of report.riskFactors) {
    lines.push(`- ${f.label}: ${f.score}/100`)
  }
  lines.push('')

  lines.push('## Analysis')
  lines.push(`**Whale activity (${report.dataQuality.onchain}):** ${report.whaleActivity}`)
  lines.push('')
  lines.push(`**Developer activity:** ${report.developerActivity}`)
  lines.push('')
  lines.push(`**Holder health:** ${report.holderHealth}`)
  lines.push('')
  lines.push(`**AI analysis:** ${report.aiAnalysis}`)
  lines.push('')
  lines.push(`**Verdict:** ${report.verdict}`)

  return lines.join('\n')
}

function triggerDownload(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

function safeFileSlug(query: string): string {
  return query.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'report'
}

export function downloadReportAsJson(report: ResearchReport) {
  triggerDownload(`coreledger-${safeFileSlug(report.tokenQuery)}.json`, JSON.stringify(report, null, 2), 'application/json')
}

export function downloadReportAsMarkdown(report: ResearchReport) {
  triggerDownload(`coreledger-${safeFileSlug(report.tokenQuery)}.md`, reportToMarkdown(report), 'text/markdown')
}

export async function copyReportToClipboard(report: ResearchReport): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(reportToMarkdown(report))
    return true
  } catch {
    return false
  }
}
