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
| Social (Twitter/X, Reddit, Telegram, sentiment) | **CoinGecko** community data | Live when available, otherwise `unavailable` — see the Twitter/X caveat below |
| Holder concentration, whale accumulation, liquidity locked | Deterministic simulator (`onchainData.ts`) | Simulated — see below |

### Known limitation: CoinGecko's Twitter/X follower counts

X locked down third-party API access in mid-2023, and CoinGecko lost the
ability to refresh most tokens' follower counts as a result. In practice this
field now reads either exactly `0` (never successfully fetched) or a number
frozen at whatever it was years ago — there's no per-field timestamp in the
API response to detect staleness directly.

`marketData.ts` handles this by treating an exact `0` as "no real data"
(dropped to `null`, since a real token essentially never has zero followers —
`0` is a far more reliable signal of a dead integration than a true count).
Any nonzero value is still surfaced, but every consumer — the AI prompt, the
JSON/Markdown export, and the report UI (a small ⚠️ next to the stat) — is
told explicitly via `SocialData.twitterDataCaveat` that the number may be
years out of date, so it's never presented as fresh live data. Reddit and
Telegram counts aren't affected by this and don't carry the caveat.

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
- **Live trending tokens on the idle screen** (`GET /api/trending`, backed by
  CoinGecko's free trending endpoint, 60s cached) — replaces a hardcoded
  ticker list with what's actually being searched right now; falls back to a
  static example list if the fetch fails.
- **7-day price sparkline** in the market snapshot, hand-rolled SVG (no
  charting library, zero bundle cost) driven by CoinGecko's sparkline data.
- **Risk score radial gauge** instead of a plain number, for the single most
  important figure in the report.
- **One-click share links** — "Share" copies a deep link (`/app?q=...`) that
  reruns the same query for whoever opens it; separate from the Markdown/JSON
  export buttons.

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

## Production hardening
- **Timeouts on every outbound call** — CoinGecko lookups (8s) and the AI provider call (25s) both use `AbortController`, so a hung upstream can no longer hang the request indefinitely; it falls through to the fallback report instead.
- **Rate limiting on `/api/research`** (`express-rate-limit`, 12 req/min/IP) — this endpoint fans out to both CoinGecko and a paid AI provider, so it's the one route that needs abuse protection most.
- **Startup + request-time config validation** — `checkAiBaseUrlForCommonMistakes()` in `aiClient.ts` catches the exact misconfigurations that are easy to hit by hand (a base URL that already includes `/chat/completions`, a missing scheme, `http://` against a remote host). It runs both at server boot (a `console.warn` if `.env` looks wrong) and before every AI request (fails fast with an actionable message instead of a doomed network call).
- **Sanitized client-facing errors** — the full AI failure reason is always logged server-side, but outside `NODE_ENV=production` it's also shown as-is in the UI (useful for local debugging); in production it's collapsed to a short, safe summary so upstream error bodies (which can contain internal URLs/HTML/account details) never reach the browser.
- **React error boundary** (`components/ErrorBoundary.tsx`) — a render error anywhere in the app now shows a recoverable error screen instead of a blank white page.
- **Optional CoinGecko API key** (`COINGECKO_API_KEY` / `COINGECKO_PLAN`) — works with zero config either way; adding a Demo or Pro key raises the shared rate-limit ceiling under real traffic.
- **`NodeSphere` (three.js) is now lazy-loaded** via `React.lazy`/`Suspense` on the landing page, out of the initial JS bundle.
- **Prompt-injection isolation** — the user-supplied token query is wrapped in explicit delimiters and the system prompt tells the model to treat it as inert lookup data, never as instructions.
- **`aria-live="polite"` on the report status region** — loading/error/done state changes (and the rotating status text during a scan) are now announced to screen readers.
- **A real test suite** (`npm test` in `client/` and `server/`, via Vitest) covering the CoinGecko response parsing (including the Twitter-staleness fix), the `AI_BASE_URL` misconfiguration detector, Markdown export, and localStorage-degradation behavior — plus a GitHub Actions workflow (`.github/workflows/ci.yml`) that runs lint, typecheck, tests, and build on every push/PR.

> **One manual step required:** the `package-lock.json` files weren't regenerated when the dependencies above (`express-rate-limit`, `vitest`, `lucide-react`) were added to `package.json` — that requires running npm with network access, which wasn't available while generating this update. Run `npm install` in both `client/` and `server/` once before relying on `npm ci` (including in the CI workflow above) or the lockfiles will be out of sync.

## Known backlog (not yet addressed)
- Client and server hand-duplicate the same TypeScript types (no shared package) — they can drift
- No persistence — recent searches are per-browser (`localStorage`) only; no server-side report history
- Test coverage is a starting point (parsing logic, config validation, export formatting), not comprehensive — routes, the orchestrator, and React components have no tests yet
