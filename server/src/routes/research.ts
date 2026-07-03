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
      usedFallback = true
      fallbackReason = (aiError as Error).message
      report = synthesizeFallbackReport(query, inputs)
      console.warn('[research] AI generation failed, served fallback report:', fallbackReason)
    }

    return res.json({ report, snapshot: inputs.onchain, usedFallback, fallbackReason })
  } catch (err) {
    console.error('[research] unexpected error:', err)
    return res.status(500).json({ error: 'Failed to generate report. Please try again.' })
  }
})

export default router
