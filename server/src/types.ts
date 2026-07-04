export interface RiskFactor {
  label: string
  score: number // 0-100
}

export interface TrendingToken {
  id: string
  name: string
  symbol: string
  thumb: string | null
  marketCapRank: number | null
}

/**
 * Per-section provenance so the client can render an honest "live vs
 * simulated" badge instead of presenting everything as equally authoritative.
 *
 *   live        - fetched from a real external API this request
 *   simulated   - deterministically generated placeholder data (no provider wired)
 *   unavailable - a real provider was queried but returned nothing usable
 */
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
  /**
   * Non-null whenever twitterFollowers is present, warning that CoinGecko's
   * X/Twitter follower counts are frequently stale/frozen since X locked
   * down third-party API access in 2023. See marketData.ts for detail.
   */
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
  riskScore: number // 0-100 overall
  confidence: number // 0-100
  recommendation: string
  marketCycle: string
  whaleActivity: string
  developerActivity: string
  holderHealth: string
  aiAnalysis: string
  verdict: string
  riskFactors: RiskFactor[]
  generatedAt: string
  /** @deprecated kept for backwards compatibility — prefer dataQuality.onchain */
  dataSource: 'live' | 'mock'
  marketData: MarketData | null
  developerData: DeveloperData | null
  socialData: SocialData | null
  dataQuality: DataQualityMap
}

export interface OnchainSnapshot {
  address: string
  topHolderConcentrationPct: number
  whaleNetAccumulation30dPct: number
  liquidityLockedPct: number
  githubCommits30d: number
  activeContributors: number
  contractFlags: string[]
  isMockData: boolean
}

export interface MarketSnapshot {
  marketData: MarketData | null
  developerData: DeveloperData | null
  socialData: SocialData | null
}
