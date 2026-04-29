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

import { prisma } from './models/User'
import { sendRenewalReminderEmail } from './services/emailService'
import authRoutes         from './routes/auth'
import subscriptionRoutes from './routes/subscription'
import { handleWebhook }  from './controllers/subscriptionController'
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
const frontendOrigin = process.env.FRONTEND_URL ?? 'http://localhost:5173'
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc:     ["'none'"],
      scriptSrc:      ["'self'"],
      styleSrc:       ["'self'", "'unsafe-inline'"],
      imgSrc:         ["'self'", 'data:', 'https:'],
      connectSrc:     ["'self'", frontendOrigin],
      fontSrc:        ["'self'"],
      objectSrc:      ["'none'"],
      frameSrc:       ["'none'"],
      baseUri:        ["'self'"],
      formAction:     ["'self'"],
      upgradeInsecureRequests: [],
    },
  },
  hsts: {
    maxAge:            31_536_000,
    includeSubDomains: true,
    preload:           true,
  },
  frameguard:   { action: 'deny' },
  noSniff:       true,
  xssFilter:     true,
}))

// CORS
app.use(cors({ origin: process.env.FRONTEND_URL ?? 'http://localhost:5173' }))

// Global rate limiter — applied before all routes
app.use(generalLimiter)

// ⚠  Stripe webhook needs raw body — bypass the Router entirely and call handleWebhook directly
app.post('/api/subscription/webhook', express.raw({ type: 'application/json' }), handleWebhook)

// Body parsing with size limit + sanitization
app.use(express.json({ limit: '1mb' }))
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

async function cleanupExpiredTokens() {
  try {
    const { count } = await prisma.passwordResetToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    })
    if (count > 0) console.log(`[cleanup] ${count} tokens de reset expirados eliminados`)
  } catch (err) {
    console.error('[cleanup] Error eliminando tokens expirados:', err)
  }
}

function planLabelFromPriceId(priceId: string | null | undefined): string {
  if (!priceId) return 'Starter'
  const e = process.env.STRIPE_PRICE_ID_ENTERPRISE
  const p = process.env.STRIPE_PRICE_ID_PRO
  if (e && priceId === e) return 'Enterprise'
  if (p && priceId === p) return 'Pro'
  return 'Starter'
}

async function sendRenewalReminders() {
  try {
    const now     = new Date()
    const in3days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
    const in4days = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000)

    // Find active users whose subscription ends in the [now+3d, now+4d) window
    const users = await prisma.user.findMany({
      where: {
        subscriptionStatus: 'active',
        subscriptionEnd:    { gte: in3days, lt: in4days },
      },
      select: { email: true, name: true, subscriptionEnd: true, priceId: true },
    })

    for (const user of users) {
      const renewalStr = user.subscriptionEnd!.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
      sendRenewalReminderEmail(user.email, user.name, renewalStr, planLabelFromPriceId(user.priceId))
        .catch(e => console.error(`[email] recordatorio renovación para ${user.email}:`, e))
    }

    if (users.length > 0) console.log(`[renewal] Recordatorios enviados: ${users.length}`)
  } catch (err) {
    console.error('[renewal] Error enviando recordatorios de renovación:', err)
  }
}

app.listen(PORT, () => {
  console.log(`🚀 AgencyOS API  →  http://localhost:${PORT}`)
  console.log(`   Health        →  http://localhost:${PORT}/api/health\n`)
  cleanupExpiredTokens()
  setInterval(cleanupExpiredTokens, 24 * 60 * 60 * 1000)
  sendRenewalReminders()
  setInterval(sendRenewalReminders, 24 * 60 * 60 * 1000)
})

export default app
