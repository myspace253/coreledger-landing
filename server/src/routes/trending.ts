import { Router } from 'express'
import { fetchTrendingTokens } from '../services/marketData.js'

const router = Router()

router.get('/trending', async (_req, res) => {
  const tokens = await fetchTrendingTokens()
  res.json({ tokens })
})

export default router
