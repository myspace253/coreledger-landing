import { describe, expect, it } from 'vitest'
import { parseDeveloperData, parseMarketData, parseSocialData } from '../services/marketData.js'

describe('parseMarketData', () => {
  it('extracts price, market cap, and supply figures from a CoinGecko coin object', () => {
    const coin = {
      id: 'pepe',
      symbol: 'pepe',
      name: 'Pepe',
      image: { small: 'https://example.com/pepe.png' },
      market_cap_rank: 42,
      market_data: {
        current_price: { usd: 0.0000123 },
        market_cap: { usd: 5_000_000_000 },
        fully_diluted_valuation: { usd: 5_200_000_000 },
        total_volume: { usd: 300_000_000 },
        price_change_percentage_24h: 4.2,
        price_change_percentage_7d: -1.1,
        circulating_supply: 420_690_000_000_000,
        total_supply: 420_690_000_000_000,
        max_supply: null,
        ath: { usd: 0.00004 },
        ath_change_percentage: { usd: -69 },
      },
    }

    const result = parseMarketData(coin)

    expect(result.symbol).toBe('PEPE')
    expect(result.currentPriceUsd).toBeCloseTo(0.0000123)
    expect(result.marketCapRank).toBe(42)
    expect(result.maxSupply).toBeNull()
  })

  it('returns null fields rather than throwing when market_data is entirely missing', () => {
    const result = parseMarketData({ id: 'x', symbol: 'x', name: 'X' })
    expect(result.currentPriceUsd).toBeNull()
    expect(result.marketCapUsd).toBeNull()
  })
})

describe('parseDeveloperData', () => {
  it('returns null when CoinGecko has no linked repo (all-null developer_data)', () => {
    const coin = { developer_data: { forks: null, stars: null, commit_count_4_weeks: null } }
    expect(parseDeveloperData(coin)).toBeNull()
  })

  it('returns null when developer_data is absent entirely', () => {
    expect(parseDeveloperData({})).toBeNull()
  })

  it('extracts real stats and the first GitHub repo URL when present', () => {
    const coin = {
      developer_data: { stars: 1200, forks: 300, commit_count_4_weeks: 45, pull_request_contributors: 12 },
      links: { repos_url: { github: ['https://github.com/example/repo', 'https://github.com/example/other'] } },
    }
    const result = parseDeveloperData(coin)
    expect(result?.stars).toBe(1200)
    expect(result?.githubUrl).toBe('https://github.com/example/repo')
  })
})

describe('parseSocialData — Twitter staleness handling', () => {
  it('drops a Twitter follower count of exactly 0 as an almost-certainly-broken integration, not a real zero', () => {
    const coin = { community_data: { twitter_followers: 0, reddit_subscribers: 500 } }
    const result = parseSocialData(coin)
    expect(result?.twitterFollowers).toBeNull()
    expect(result?.twitterDataCaveat).toBeNull()
    // Reddit data is unaffected by the Twitter-specific fix.
    expect(result?.redditSubscribers).toBe(500)
  })

  it('keeps a nonzero Twitter follower count but attaches a staleness caveat', () => {
    const coin = { community_data: { twitter_followers: 894_321 } }
    const result = parseSocialData(coin)
    expect(result?.twitterFollowers).toBe(894_321)
    expect(result?.twitterDataCaveat).toMatch(/2023/)
  })

  it('returns null when every social field is null (no community data at all)', () => {
    const coin = { community_data: { twitter_followers: 0, reddit_subscribers: null, telegram_channel_user_count: null } }
    expect(parseSocialData(coin)).toBeNull()
  })
})
