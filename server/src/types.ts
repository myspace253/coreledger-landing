export interface RiskFactor {
  label: string
  score: number // 0-100
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
  dataSource: 'live' | 'mock'
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
