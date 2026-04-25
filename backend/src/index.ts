import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'

dotenv.config()

import { validateEnv, generalLimiter, sanitizeBody } from './middleware/security'

// Validate env vars before anything else
console.log('\n🔐 Verificando variables de entorno…')
validateEnv()
console.log('  ✓ Variables de entorno OK\n')

import authRoutes         from './routes/auth'
import subscriptionRoutes from './routes/subscription'
import campaignRoutes     from './routes/campaigns'
import contentRoutes      from './routes/content'
import calendarRoutes     from './routes/calendar'
import budgetRoutes       from './routes/budget'
import briefingRoutes     from './routes/briefing'
import competitorRoutes   from './routes/competitor'
import homeRoutes         from './routes/home'
import frameworkRoutes    from './routes/frameworks'
import settingsRoutes     from './routes/settings'
import apiKeyRoutes       from './routes/apiKeys'

const app  = express()
const PORT = process.env.PORT ?? 3001

// Trust proxy (Railway / Vercel sit behind a reverse proxy)
app.set('trust proxy', 1)

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}))

// CORS
app.use(cors({ origin: process.env.FRONTEND_URL ?? 'http://localhost:5173' }))

// Global rate limiter — applied before all routes
app.use(generalLimiter)

// ⚠  Stripe webhook needs raw body — mount BEFORE express.json()
app.post(
  '/api/subscription/webhook',
  express.raw({ type: 'application/json' }),
  (req, res, next) => { subscriptionRoutes(req, res, next) },
)

// Body parsing with size limit + sanitization
app.use(express.json({ limit: '10mb' }))
app.use(sanitizeBody)

// Routes
app.use('/api/auth',         authRoutes)
app.use('/api/subscription', subscriptionRoutes)
app.use('/api/campaigns',    campaignRoutes)
app.use('/api/content',      contentRoutes)
app.use('/api/calendar',     calendarRoutes)
app.use('/api/budget',       budgetRoutes)
app.use('/api/briefing',     briefingRoutes)
app.use('/api/competitor',   competitorRoutes)
app.use('/api/home',         homeRoutes)
app.use('/api/frameworks',   frameworkRoutes)
app.use('/api/settings',     settingsRoutes)
app.use('/api/apikeys',      apiKeyRoutes)

// Health
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'AgencyOS API running', timestamp: new Date().toISOString() })
})

app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint not found' })
})

app.listen(PORT, () => {
  console.log(`🚀 AgencyOS API  →  http://localhost:${PORT}`)
  console.log(`   Health        →  http://localhost:${PORT}/api/health\n`)
})

export default app
