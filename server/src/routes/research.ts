import { Router } from 'express'
import { z } from 'zod'
import { gatherResearchInputs } from '../services/researchOrchestrator.js'
import { generateResearchReport, synthesizeFallbackReport } from '../services/aiClient.js'

const router = Router()

const requestSchema = z.object({
  query: z
    .string()
    .trim()
    .min(3, 'Provide a token address or ticker (min 3 characters).')
    .max(120),
})

/**
 * The raw AI error message is genuinely useful during local development
 * (it's exactly what let us diagnose doubled endpoint paths, insufficient
 * credit, wrong hosts, etc. turn by turn) so it's passed through as-is
 * outside production. In production, showing raw upstream error bodies
 * (which can contain internal URLs, provider account details, or stray
 * HTML from a misrouted request) to every visitor is an information leak,
 * so it's collapsed to a short, safe summary there — the full detail is
 * still in the server logs via console.warn below.
 */
function sanitizeFallbackReasonForClient(message: string): string {
  if (process.env.NODE_ENV !== 'production') return message
  const looksLikeHtml = message.trim().toLowerCase().startsWith('<') || message.includes('<!doctype')
  if (looksLikeHtml) return 'AI provider returned an unexpected response.'
  return message.length > 200 ? `${message.slice(0, 200)}…` : message
}

router.post('/research', async (req, res) => {
  const parsed = requestSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid request.' })
  }

  const { query } = parsed.data

  try {
    const inputs = await gatherResearchInputs(query)

    let report
    let usedFallback = false
    let fallbackReason: string | undefined
    try {
      report = await generateResearchReport(query, inputs)
    } catch (aiError) {
      // AI provider not configured or errored — degrade gracefully instead of failing the request.
      const fullReason = (aiError as Error).message
      usedFallback = true
      fallbackReason = sanitizeFallbackReasonForClient(fullReason)
      report = synthesizeFallbackReport(query, inputs)
      console.warn('[research] AI generation failed, served fallback report:', fullReason)
    }

    return res.json({ report, snapshot: inputs.onchain, usedFallback, fallbackReason })
  } catch (err) {
    console.error('[research] unexpected error:', err)
    return res.status(500).json({ error: 'Failed to generate report. Please try again.' })
  }
})

export default router
