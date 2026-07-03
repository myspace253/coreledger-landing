import type { OnchainSnapshot } from '../types.js'

/**
 * This module is the seam between "real on-chain data" and the rest of the
 * app, specifically for holder distribution, whale flow, and liquidity —
 * numbers that genuinely require a paid/keyed provider. Today it returns
 * deterministic mock data so the product works end-to-end out of the box.
 *
 * Note this is deliberately narrower than it once was: developer activity
 * and market data are now sourced for real from CoinGecko's free public API
 * (see `marketData.ts`) and no longer need to live here. What's left —
 * holder concentration, whale accumulation, liquidity-locked % — has no
 * genuinely free source: Etherscan's free tier doesn't expose a
 * holder-distribution endpoint (it's gated behind their paid plans), so an
 * ETHERSCAN_API_KEY alone can't produce real numbers for this section. To go
 * live here, wire in one of:
 *
 *   - Holder distribution / whale flows -> Moralis or Alchemy token-holder APIs
 *   - Liquidity locked                  -> DEX subgraphs (Uniswap/PancakeSwap via The Graph)
 *   - Contract flags (mintable, proxy…) -> static analysis (e.g. a Slither run) or
 *                                          a contract-scanning API (GoPlus, Token Sniffer)
 *
 * Keep the return shape (OnchainSnapshot) stable so the AI prompt and the
 * frontend don't need to change when you swap the data source.
 */

function seededRandom(seed: string) {
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = (h << 5) - h + seed.charCodeAt(i)
    h |= 0
  }
  return () => {
    h = (h * 1103515245 + 12345) & 0x7fffffff
    return h / 0x7fffffff
  }
}

export async function fetchOnchainSnapshot(query: string): Promise<OnchainSnapshot> {
  const hasRealProviders = Boolean(
    process.env.ETHERSCAN_API_KEY || process.env.ALCHEMY_API_KEY || process.env.MORALIS_API_KEY
  )

  if (hasRealProviders) {
    // TODO: wire real provider calls here and return early with isMockData: false.
    // Left unimplemented intentionally — plug in the providers you actually hold
    // keys for, since each has a different holder/liquidity/dev-activity schema.
  }

  const rand = seededRandom(query.toLowerCase())
  return {
    address: query,
    topHolderConcentrationPct: Math.round(20 + rand() * 40),
    whaleNetAccumulation30dPct: Math.round(-5 + rand() * 20),
    liquidityLockedPct: Math.round(50 + rand() * 45),
    githubCommits30d: Math.round(20 + rand() * 250),
    activeContributors: Math.round(2 + rand() * 18),
    contractFlags: rand() > 0.7 ? ['upgradeable_proxy'] : [],
    isMockData: true,
  }
}
