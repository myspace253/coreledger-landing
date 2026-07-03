import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import researchRouter from './routes/research.js'

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

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    aiConfigured: Boolean(process.env.AI_BASE_URL && process.env.AI_API_KEY),
  })
})

app.use('/api', researchRouter)

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
  }
})
