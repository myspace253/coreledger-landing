import type { DeveloperData, MarketData, MarketSnapshot, SocialData } from '../types.js'

/**
 * Real market/developer/social data, sourced from CoinGecko's public API.
 *
 * Why CoinGecko and not Etherscan for this? Etherscan's free tier doesn't
 * expose a holder-distribution endpoint (that lives behind their paid/"Pro"
 * plans, or requires scraping), so an ETHERSCAN_API_KEY alone can't get us
 * genuine top-holder concentration or whale-flow numbers — that stays
 * simulated in `onchainData.ts` until a provider that actually exposes it
 * (Moralis, Alchemy's token API, Nansen, etc.) is wired in.
 *
 * CoinGecko's `/coins/{id}` endpoint, by contrast, needs no API key on the
 * free tier and genuinely returns price/market-cap/supply data, GitHub
 * developer stats, and community/social follower counts for most listed
 * tokens — so it's used here for those three sections. Every value coming
 * back from this module is real if present; if CoinGecko doesn't have the
 * token (or the lookup fails), the corresponding section is `null` and the
 * caller is expected to mark it 'unavailable' rather than inventing numbers.
 */

const BASE_URL = 'https://api.coingecko.com/api/v3'
const ETH_ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/

// Free-tier rate limits are tight (roughly 10-30 req/min, shared across all
// Coreledger users). A short in-memory cache keeps repeat lookups of the
// same token cheap without needing a database.
const CACHE_TTL_MS = 60_000
const cache = new Map<string, { expiresAt: number; data: unknown }>()

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function cachedFetch(url: string): Promise<unknown> {
  const cached = cache.get(url)
  if (cached && cached.expiresAt > Date.now()) return cached.data

  const maxAttempts = 3
  let lastError: unknown

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const res = await fetch(url, { headers: { Accept: 'application/json' } })

      if (res.status === 429) {
        // Rate-limited — back off and retry rather than failing the whole report.
        await sleep(400 * (attempt + 1))
        continue
      }
      if (res.status === 404) return null
      if (!res.ok) throw new Error(`CoinGecko responded ${res.status}`)

      const data = await res.json()
      cache.set(url, { expiresAt: Date.now() + CACHE_TTL_MS, data })
      return data
    } catch (err) {
      lastError = err
      await sleep(250 * (attempt + 1))
    }
  }

  throw lastError instanceof Error ? lastError : new Error('CoinGecko request failed')
}

interface CoinGeckoSearchResult {
  coins?: { id: string; symbol: string; name: string; market_cap_rank: number | null }[]
}

async function findCoinIdBySearch(query: string): Promise<string | null> {
  const data = (await cachedFetch(
    `${BASE_URL}/search?query=${encodeURIComponent(query)}`
  )) as CoinGeckoSearchResult | null
  const coins = data?.coins ?? []
  if (coins.length === 0) return null

  const lower = query.trim().toLowerCase()
  const exact = coins.find((c) => c.symbol.toLowerCase() === lower || c.name.toLowerCase() === lower)
  if (exact) return exact.id

  // No exact match — fall back to the highest-ranked (lowest rank number) result.
  const ranked = [...coins].sort((a, b) => (a.market_cap_rank ?? 1e9) - (b.market_cap_rank ?? 1e9))
  return ranked[0]?.id ?? null
}

// Common EVM platforms CoinGecko indexes contract lookups under. Checked in
// order; the first hit wins. Kept short since each miss is a wasted request
// against a shared rate limit.
const CONTRACT_PLATFORMS = ['ethereum', 'binance-smart-chain', 'polygon-pos', 'arbitrum-one', 'base'] as const

async function fetchCoinDetail(idOrContractPath: string): Promise<Record<string, unknown> | null> {
  const data = await cachedFetch(
    `${BASE_URL}/${idOrContractPath}?localization=false&tickers=false&market_data=true&community_data=true&developer_data=true&sparkline=false`
  )
  return (data as Record<string, unknown>) ?? null
}

async function findCoinByContract(address: string): Promise<Record<string, unknown> | null> {
  for (const platform of CONTRACT_PLATFORMS) {
    try {
      const coin = await fetchCoinDetail(`coins/${platform}/contract/${address}`)
      if (coin && coin.id) return coin
    } catch {
      // try the next platform — a miss on one chain doesn't mean the token isn't on another
    }
  }
  return null
}

function num(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function parseMarketData(coin: Record<string, unknown>): MarketData {
  const marketDataRaw = (coin.market_data ?? {}) as Record<string, any>
  return {
    id: String(coin.id ?? ''),
    symbol: String(coin.symbol ?? '').toUpperCase(),
    name: String(coin.name ?? ''),
    image: (coin.image as { small?: string } | undefined)?.small ?? null,
    currentPriceUsd: num(marketDataRaw.current_price?.usd),
    marketCapUsd: num(marketDataRaw.market_cap?.usd),
    marketCapRank: num(coin.market_cap_rank ?? marketDataRaw.market_cap_rank),
    fullyDilutedValuationUsd: num(marketDataRaw.fully_diluted_valuation?.usd),
    totalVolume24hUsd: num(marketDataRaw.total_volume?.usd),
    priceChangePct24h: num(marketDataRaw.price_change_percentage_24h),
    priceChangePct7d: num(marketDataRaw.price_change_percentage_7d),
    circulatingSupply: num(marketDataRaw.circulating_supply),
    totalSupply: num(marketDataRaw.total_supply),
    maxSupply: num(marketDataRaw.max_supply),
    athUsd: num(marketDataRaw.ath?.usd),
    athChangePct: num(marketDataRaw.ath_change_percentage?.usd),
  }
}

function parseDeveloperData(coin: Record<string, unknown>): DeveloperData | null {
  const dev = coin.developer_data as Record<string, any> | undefined
  if (!dev) return null

  // CoinGecko still returns an (all-null) developer_data object for tokens
  // with no linked repo — treat that as "no developer data" rather than live zeros.
  const hasAnySignal = [dev.stars, dev.forks, dev.commit_count_4_weeks].some((v) => typeof v === 'number')
  if (!hasAnySignal) return null

  const links = coin.links as Record<string, any> | undefined
  const githubUrl = Array.isArray(links?.repos_url?.github) ? links.repos_url.github[0] ?? null : null

  return {
    githubUrl,
    stars: num(dev.stars),
    forks: num(dev.forks),
    subscribers: num(dev.subscribers),
    totalIssues: num(dev.total_issues),
    closedIssues: num(dev.closed_issues),
    pullRequestsMerged: num(dev.pull_requests_merged),
    pullRequestContributors: num(dev.pull_request_contributors),
    commitCount4Weeks: num(dev.commit_count_4_weeks),
  }
}

function parseSocialData(coin: Record<string, unknown>): SocialData | null {
  const community = coin.community_data as Record<string, any> | undefined
  const twitterFollowers = num(community?.twitter_followers)
  const redditSubscribers = num(community?.reddit_subscribers)
  const telegramUsers = num(community?.telegram_channel_user_count)
  const sentimentUpPct = num(coin.sentiment_votes_up_percentage)
  const sentimentDownPct = num(coin.sentiment_votes_down_percentage)

  if ([twitterFollowers, redditSubscribers, telegramUsers, sentimentUpPct].every((v) => v === null)) {
    return null
  }

  return { twitterFollowers, redditSubscribers, telegramUsers, sentimentUpPct, sentimentDownPct }
}

const EMPTY_SNAPSHOT: MarketSnapshot = { marketData: null, developerData: null, socialData: null }

export async function fetchMarketSnapshot(query: string): Promise<MarketSnapshot> {
  const trimmed = query.trim()
  if (!trimmed) return EMPTY_SNAPSHOT

  try {
    const coin = ETH_ADDRESS_RE.test(trimmed)
      ? await findCoinByContract(trimmed)
      : await (async () => {
          const id = await findCoinIdBySearch(trimmed)
          return id ? fetchCoinDetail(`coins/${id}`) : null
        })()

    if (!coin) return EMPTY_SNAPSHOT

    return {
      marketData: parseMarketData(coin),
      developerData: parseDeveloperData(coin),
      socialData: parseSocialData(coin),
    }
  } catch (err) {
    console.warn('[marketData] CoinGecko lookup failed, continuing without live market data:', (err as Error).message)
    return EMPTY_SNAPSHOT
  }
}
