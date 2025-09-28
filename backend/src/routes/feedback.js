import express from 'express'
import { z } from 'zod'
import { aiClient } from '../services/aiClient.js'

export const router = express.Router()

const generateSchema = z.object({
  message: z.string().min(1),
  context: z.string().optional(),
  tone: z.string().optional(),
  language: z.string().optional(),
  options: z.record(z.any()).optional()
})

router.post('/generate', async (req, res, next) => {
  try {
    const parsed = generateSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid request body', details: parsed.error.flatten() })
    }

    const { message, context, tone, language, options } = parsed.data

    const result = await aiClient.generate({ message, context, tone, language, options })
    res.json(result)
  } catch (err) {
    next(err)
  }
})

router.get('/stream', async (req, res, next) => {
  try {
    const { message, context, tone, language } = req.query
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Missing required query param: message' })
    }

    // SSE headers
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.flushHeaders?.()

    const onChunk = (text) => {
      res.write(`event: chunk\n`)
      res.write(`data: ${JSON.stringify({ text })}\n\n`)
    }

    const onDone = (meta) => {
      res.write(`event: done\n`)
      res.write(`data: ${JSON.stringify(meta || {})}\n\n`)
      res.end()
    }

    const onError = (error) => {
      res.write(`event: error\n`)
      res.write(`data: ${JSON.stringify({ error: String(error) })}\n\n`)
      res.end()
    }

    await aiClient.stream({ message, context, tone, language }, { onChunk, onDone, onError })
  } catch (err) {
    next(err)
  }
})
