import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
// nodemon restart trigger: 2025-09-28T19:35

import { router as healthRouter } from './routes/health.js'
import { router as feedbackRouter } from './routes/feedback.js'
import { notFound, errorHandler } from './middleware/errorHandler.js'

const app = express()

app.use(cors())
app.use(express.json({ limit: '1mb' }))
app.use(morgan('dev'))

app.use('/health', healthRouter)
app.use('/api/feedback', feedbackRouter)

app.use(notFound)
app.use(errorHandler)

const PORT = process.env.PORT || 8080
app.listen(PORT, () => {
  console.log(`[feedback-bot] API listening on http://localhost:${PORT}`)
})
