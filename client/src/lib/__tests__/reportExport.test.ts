import { describe, expect, it } from 'vitest'
import { reportToMarkdown } from '../reportExport'
import type { ResearchReport } from '../api'

function makeReport(overrides: Partial<ResearchReport> = {}): ResearchReport {
  return {
    tokenQuery: 'PEPE',
    narrative: 'Meme',
    category: 'Meme',
    riskScore: 62,
    confidence: 70,
    recommendation: 'Neutral',
    marketCycle: 'Range-bound',
    whaleActivity: 'No notable accumulation.',
    developerActivity: 'Light activity.',
    holderHealth: 'Reasonably distributed.',
    aiAnalysis: 'This is a test analysis.',
    verdict: 'Hold and watch.',
    riskFactors: [{ label: 'Liquidity', score: 80 }],
    generatedAt: '2026-07-04T12:00:00.000Z',
    dataSource: 'live',
    marketData: null,
    developerData: null,
    socialData: null,
    dataQuality: { market: 'unavailable', developer: 'simulated', social: 'unavailable', onchain: 'simulated' },
    ...overrides,
  }
}

describe('reportToMarkdown', () => {
  it('includes the token query, risk score, and verdict', () => {
    const md = reportToMarkdown(makeReport())
    expect(md).toContain('# Coreledger report — PEPE')
    expect(md).toContain('Risk score: 62/100')
    expect(md).toContain('Hold and watch.')
  })

  it('omits the market/developer/social sections entirely when that data is null', () => {
    const md = reportToMarkdown(makeReport())
    expect(md).not.toContain('## Market snapshot')
    expect(md).not.toContain('## Developer activity')
    expect(md).not.toContain('## Social')
  })

  it('surfaces the Twitter staleness caveat with a warning marker when present', () => {
    const md = reportToMarkdown(
      makeReport({
        socialData: {
          twitterFollowers: 50_000,
          twitterDataCaveat: 'stale since 2023',
          redditSubscribers: 1000,
          telegramUsers: null,
          sentimentUpPct: 80,
          sentimentDownPct: 20,
        },
        dataQuality: { market: 'unavailable', developer: 'simulated', social: 'live', onchain: 'simulated' },
      })
    )
    expect(md).toContain('⚠️ stale since 2023')
  })
})
