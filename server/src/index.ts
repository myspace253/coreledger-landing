import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import researchRouter from './routes/research.js'
import trendingRouter from './routes/trending.js'
import { checkAiBaseUrlForCommonMistakes } from './services/aiClient.js'

const app = express()
const port = Number(process.env.PORT) || 8787
// Comma-separated list supported, e.g. "http://localhost:5173,https://yourapp.com".
// With the Vite dev proxy in place this rarely matters in dev (requests arrive
// same-origin from Vite's perspective), but it's needed if you ever call the
// API directly from the browser, or in production.
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean)

app.use(
  cors({
    origin(origin, callback) {
      // no Origin header (curl, server-to-server, same-origin via proxy) -> allow
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true)
      callback(new Error(`Origin ${origin} not allowed by CORS`))
    },
  })
)
app.use(express.json({ limit: '256kb' }))

// Every /api/research hit fans out to CoinGecko (shared free-tier rate limit)
// and a paid AI provider — without a limit here, one client can burn your AI
// budget or get your server's IP throttled by CoinGecko for everyone else.
// This is a coarse, in-memory, single-instance limiter; put a shared store
// (e.g. Redis) behind it if you ever run more than one server process.
const researchLimiter = rateLimit({
  windowMs: 60_000,
  limit: 12,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests — please wait a moment before generating another report.' },
})

// Lighter limit than /api/research — this just serves a 60s-cached CoinGecko
// list, so it's cheap, but still capped to keep any one client from hammering it.
const trendingLimiter = rateLimit({
  windowMs: 60_000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
})

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    aiConfigured: Boolean(process.env.AI_BASE_URL && process.env.AI_API_KEY),
  })
})

app.use('/api/research', researchLimiter)
app.use('/api', researchRouter)
app.use('/api/trending', trendingLimiter)
app.use('/api', trendingRouter)

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found.' })
})

app.listen(port, () => {
  console.log(`Coreledger API listening on http://localhost:${port}`)
  if (!process.env.AI_API_KEY) {
    console.warn(
      '⚠️  AI_API_KEY is not set — /api/research will serve locally-synthesized fallback reports. ' +
        'Copy server/.env.example to server/.env and add a provider key for full AI analysis.'
    )
  } else if (process.env.AI_BASE_URL) {
    // Catch the specific misconfigurations that repeatedly cause confusing
    // failures (doubled endpoint paths, missing scheme, http vs https)
    // at boot time, rather than only surfacing on the first failed request.
    const issue = checkAiBaseUrlForCommonMistakes(process.env.AI_BASE_URL)
    if (issue) console.warn(`⚠️  ${issue}`)
  }
})
