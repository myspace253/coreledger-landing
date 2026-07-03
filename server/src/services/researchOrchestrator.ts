import type { DataQualityMap, MarketSnapshot, OnchainSnapshot } from '../types.js'
import { fetchOnchainSnapshot } from './onchainData.js'
import { fetchMarketSnapshot } from './marketData.js'

export interface ResearchInputs {
  onchain: OnchainSnapshot
  market: MarketSnapshot
  dataQuality: DataQualityMap
}

/**
 * Single place that gathers every data source a report needs and tags each
 * section with where it actually came from. Downstream consumers (the AI
 * prompt builder, the fallback synthesizer, the client UI) all read
 * `dataQuality` instead of re-deriving it, so "live vs simulated" can never
 * drift between what the badge says and what the numbers actually are.
 */
export async function gatherResearchInputs(query: string): Promise<ResearchInputs> {
  const [onchain, market] = await Promise.all([fetchOnchainSnapshot(query), fetchMarketSnapshot(query)])

  const dataQuality: DataQualityMap = {
    onchain: onchain.isMockData ? 'simulated' : 'live',
    market: market.marketData ? 'live' : 'unavailable',
    // Developer activity prefers CoinGecko's real GitHub-derived stats; if
    // those aren't available for this token, fall back to the simulated
    // commit/contributor figures from the onchain snapshot rather than
    // showing nothing.
    developer: market.developerData ? 'live' : 'simulated',
    social: market.socialData ? 'live' : 'unavailable',
  }

  return { onchain, market, dataQuality }
}
