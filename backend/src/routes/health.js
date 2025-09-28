import express from 'express'

export const router = express.Router()

router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    model: process.env.AI_MODEL_NAME || 'Feedback bot',
    hasApiUrl: Boolean(process.env.AI_API_BASE_URL)
  })
})
