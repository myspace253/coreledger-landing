# Coreledger — AI Research Terminal for Crypto Assets

Full-stack app: paste a token address or ticker, get an AI-generated
investment intelligence report (narrative, risk score, market data, whale
activity, developer activity, holder health, social sentiment) in seconds.

## Structure
```
coreledger/
  client/     React + Vite + Tailwind + Motion + GSAP + Lenis + R3F frontend
  server/     Express + TypeScript API — data gathering + AI reasoning
```

## Quick start
```bash
npm run setup     # installs client + server deps, creates .env files
```

Then open `server/.env` and set your AI provider key:
```
AI_BASE_URL=https://api.tokenrouter.com/v1   # or https://openrouter.ai/api/v1
AI_API_KEY=sk-...
AI_MODEL=minimax-m3
```

Run both apps together:
```bash
npm run dev        # server on :8787, client on :5173
```

Open http://localhost:5173, type an address or ticker in the terminal (hero,
or footer), hit **run** / **Generate report**.

### It works without an AI key too
If `AI_API_KEY` isn't set, `/api/research` doesn't fail — it serves a
locally-synthesized fallback report built from the same data snapshot, clearly
labeled as offline mode in the UI. Add a key any time to switch to full LLM
reasoning with no other changes.

## Where the data actually comes from

Every report is assembled from two independent sources, gathered in parallel
by `server/src/services/researchOrchestrator.ts` and tagged with a
`dataQuality` map (`live` / `simulated` / `unavailable`) per section so the
UI can be honest about what's real:

| Section | Source | Status |
|---|---|---|
| Price, market cap, supply, ATH | **CoinGecko public API** (`marketData.ts`) | Live, no API key required |
| Developer activity (commits, stars, forks, PRs) | **CoinGecko** (proxies GitHub stats for listed tokens) | Live when the token has a linked repo, otherwise falls back to simulated figures |
| Social (Twitter/X, Reddit, Telegram, sentiment) | **CoinGecko** community data | Live when available, otherwise `unavailable` |
| Holder concentration, whale accumulation, liquidity locked | Deterministic simulator (`onchainData.ts`) | Simulated — see below |

**Why CoinGecko and not Etherscan for holder data?** An `ETHERSCAN_API_KEY`
was the original plan, but Etherscan's free tier doesn't expose a
holder-distribution endpoint — that's gated behind their paid plans. Rather
than ship a broken integration, `onchainData.ts` keeps deterministic
simulated data for that section only, and every value it produces is clearly
labeled `simulated` in both the API response and the UI (never presented as
live). CoinGecko's `/coins/{id}` endpoint, by contrast, needs no key at all
and genuinely returns price, market cap, supply, GitHub, and social data for
most listed tokens, so it's used for those three sections instead.

To make holder/whale/liquidity data live, wire a real provider into
`server/src/services/onchainData.ts`:

| Data | Suggested provider |
|---|---|
| Holder distribution / whale flow | Moralis or Alchemy token-holder APIs |
| Liquidity locked | DEX subgraphs (Uniswap/PancakeSwap via The Graph) |
| Contract flags (mintable, proxy, honeypot) | GoPlus / Token Sniffer, or your own Slither pass |

Keep the `OnchainSnapshot` shape in `server/src/types.ts` stable and nothing
downstream (the AI prompt, the frontend) needs to change.

## Frontend features
- **Data quality badges** on every section (market / developer / social /
  on-chain) so it's always clear what's live vs. simulated vs. unavailable.
- **Recent searches**, persisted to `localStorage` client-side (never sent to
  the server) — shown on the idle screen, one click to re-run.
- **Copy to clipboard** and **export as Markdown / JSON** for any generated
  report.
- **Retry logic with backoff** on the client for transient network failures
  and `502`/`503`/`504` responses, plus a request timeout so a stalled
  request doesn't hang forever, and a manual **Retry** button on failure.
- Loading, error, and empty states throughout, with copy that distinguishes
  network failures from server-side errors.

## Production checklist
- [ ] Set real `AI_API_KEY` / `AI_BASE_URL` in `server/.env`
- [ ] Optionally wire a holder-data provider in `onchainData.ts` (see table
      above) — CoinGecko-backed market/dev/social data works with zero setup
- [ ] Set `CLIENT_ORIGIN` in `server/.env` to your deployed frontend origin
- [ ] Set `VITE_API_URL` in `client/.env` to your deployed API origin
- [ ] `npm run build` in both `server/` and `client/`; serve `client/dist` as static, run `server/dist/index.js` as a Node process
- [ ] Consider `React.lazy()` around `NodeSphere` (three.js) to trim the client's initial bundle
- [ ] CoinGecko's free tier is rate-limited (roughly 10–30 req/min, shared
      across all users of your deployment); `marketData.ts` caches lookups
      for 60s in-memory to reduce load, but a high-traffic deployment should
      consider a CoinGecko API key (Demo/Pro tier) for higher limits
