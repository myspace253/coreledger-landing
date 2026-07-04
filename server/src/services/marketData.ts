import type { DeveloperData, MarketData, MarketSnapshot, SocialData, TrendingToken } from '../types.js'

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

// Optional: set COINGECKO_API_KEY in server/.env to use a Demo/Pro tier key
// for higher rate limits. Works with zero setup either way — this only
// raises the ceiling under real traffic. Demo keys use the same
// api.coingecko.com host with an added header; Pro keys use a different
// host (pro-api.coingecko.com), so that's handled here too.
const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY?.trim() || null
const COINGECKO_IS_PRO_KEY = Boolean(COINGECKO_API_KEY && process.env.COINGECKO_PLAN === 'pro')
const API_BASE_URL = COINGECKO_IS_PRO_KEY ? 'https://pro-api.coingecko.com/api/v3' : BASE_URL
const COINGECKO_HEADERS: Record<string, string> = {
  Accept: 'application/json',
  ...(COINGECKO_API_KEY
    ? { [COINGECKO_IS_PRO_KEY ? 'x-cg-pro-api-key' : 'x-cg-demo-api-key']: COINGECKO_API_KEY }
    : {}),
}

// Free-tier rate limits are tight (roughly 10-30 req/min, shared across all
// Coreledger users). A short in-memory cache keeps repeat lookups of the
// same token cheap without needing a database.
const CACHE_TTL_MS = 60_000
const REQUEST_TIMEOUT_MS = 8_000
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
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
    try {
      const res = await fetch(url, { headers: COINGECKO_HEADERS, signal: controller.signal })

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
      lastError =
        err instanceof Error && err.name === 'AbortError'
          ? new Error(`CoinGecko request timed out after ${REQUEST_TIMEOUT_MS}ms`)
          : err
      await sleep(250 * (attempt + 1))
    } finally {
      clearTimeout(timeout)
    }
  }

  throw lastError instanceof Error ? lastError : new Error('CoinGecko request failed')
}

interface CoinGeckoSearchResult {
  coins?: { id: string; symbol: string; name: string; market_cap_rank: number | null }[]
}

async function findCoinIdBySearch(query: string): Promise<string | null> {
  const data = (await cachedFetch(
    `${API_BASE_URL}/search?query=${encodeURIComponent(query)}`
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
    `${API_BASE_URL}/${idOrContractPath}?localization=false&tickers=false&market_data=true&community_data=true&developer_data=true&sparkline=true`
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

export function parseMarketData(coin: Record<string, unknown>): MarketData {
  const marketDataRaw = (coin.market_data ?? {}) as Record<string, any>
  const sparklineRaw = marketDataRaw.sparkline_7d?.price
  const sparkline7d =
    Array.isArray(sparklineRaw) && sparklineRaw.every((v: unknown) => typeof v === 'number')
      ? (sparklineRaw as number[])
      : null

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
    sparkline7d,
  }
}

export function parseDeveloperData(coin: Record<string, unknown>): DeveloperData | null {
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

export function parseSocialData(coin: Record<string, unknown>): SocialData | null {
  const community = coin.community_data as Record<string, any> | undefined
  const redditSubscribers = num(community?.reddit_subscribers)
  const telegramUsers = num(community?.telegram_channel_user_count)
  const sentimentUpPct = num(coin.sentiment_votes_up_percentage)
  const sentimentDownPct = num(coin.sentiment_votes_down_percentage)

  // CoinGecko's twitter_followers field has been effectively broken since
  // X/Twitter locked down its API in mid-2023: CoinGecko lost the ability to
  // refresh most coins' follower counts, so this field now typically reads
  // either exactly 0 (never successfully fetched) or a number frozen at
  // whatever it was years ago. There's no per-field "last updated" timestamp
  // in the API response to detect staleness directly, so:
  //   - a value of exactly 0 is treated as "no real data" and dropped —
  //     essentially no real token has genuinely zero followers, so 0 is a
  //     far more likely a sign of a dead integration than a true count.
  //   - a nonzero value is still surfaced (it may be a genuine, if outdated,
  //     count), but flagged with an explicit staleness caveat rather than
  //     presented as fresh live data.
  const rawTwitterFollowers = num(community?.twitter_followers)
  const twitterFollowers = rawTwitterFollowers === 0 ? null : rawTwitterFollowers
  const twitterDataCaveat =
    twitterFollowers !== null
      ? 'CoinGecko has been unable to refresh most tokens\u2019 X/Twitter follower counts since X restricted API access in 2023 — this number may be years out of date.'
      : null

  if ([twitterFollowers, redditSubscribers, telegramUsers, sentimentUpPct].every((v) => v === null)) {
    return null
  }

  return { twitterFollowers, twitterDataCaveat, redditSubscribers, telegramUsers, sentimentUpPct, sentimentDownPct }
}

const EMPTY_SNAPSHOT: MarketSnapshot = { marketData: null, developerData: null, socialData: null }

interface CoinGeckoTrendingResponse {
  coins?: {
    item: { id: string; name: string; symbol: string; market_cap_rank: number | null; thumb?: string }
  }[]
}

/**
 * CoinGecko's free "trending" endpoint — the top searched coins over the
 * last 24h. Used to give the dashboard's idle state real, live suggestions
 * instead of four hardcoded tickers. Cached the same way as everything else
 * in this module (60s TTL), and any failure just returns an empty list so
 * the UI can fall back to its own static examples rather than breaking.
 */
export async function fetchTrendingTokens(): Promise<TrendingToken[]> {
  try {
    const data = (await cachedFetch(`${API_BASE_URL}/search/trending`)) as CoinGeckoTrendingResponse | null
    const coins = data?.coins ?? []
    return coins.slice(0, 8).map(({ item }) => ({
      id: item.id,
      name: item.name,
      symbol: item.symbol.toUpperCase(),
      thumb: item.thumb ?? null,
      marketCapRank: num(item.market_cap_rank),
    }))
  } catch (err) {
    console.warn('[marketData] Failed to fetch trending tokens:', (err as Error).message)
    return []
  }
}

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
