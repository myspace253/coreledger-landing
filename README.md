# Coreledger — AI Research Terminal for Crypto Assets

Full-stack app: paste a token address, get an AI-generated investment
intelligence report (narrative, risk score, whale activity, dev activity,
holder health) in seconds.

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

Open http://localhost:5173, type an address in the terminal (hero, or footer),
hit **run** / **Generate report**.

### It works without an API key too
If `AI_API_KEY` isn't set, `/api/research` doesn't fail — it serves a
locally-synthesized fallback report built from the same data snapshot, clearly
labeled as offline mode in the UI. Add a key any time to switch to full LLM
reasoning with no other changes.

## Wiring in real on-chain data
`server/src/services/onchainData.ts` currently returns deterministic mock data
(holder concentration, whale flow, dev activity, contract flags). The seam is
intentional — swap its body for real calls once you have provider keys:

| Data | Suggested provider |
|---|---|
| Holder distribution / whale flow | Etherscan, Alchemy, or Moralis token-holder APIs |
| Liquidity locked | DEX subgraphs (Uniswap/PancakeSwap via The Graph) |
| Dev activity | GitHub REST API (commits, contributors, releases) |
| Contract flags (mintable, proxy, honeypot) | GoPlus / Token Sniffer, or your own Slither pass |

Keep the `OnchainSnapshot` shape in `server/src/types.ts` stable and nothing
downstream (the AI prompt, the frontend) needs to change.

## Production checklist
- [ ] Set real `AI_API_KEY` / `AI_BASE_URL` in `server/.env`
- [ ] Wire at least holder + liquidity data in `onchainData.ts`
- [ ] Set `CLIENT_ORIGIN` in `server/.env` to your deployed frontend origin
- [ ] Set `VITE_API_URL` in `client/.env` to your deployed API origin
- [ ] `npm run build` in both `server/` and `client/`; serve `client/dist` as static, run `server/dist/index.js` as a Node process
- [ ] Consider `React.lazy()` around `NodeSphere` (three.js) to trim the client's initial bundle
