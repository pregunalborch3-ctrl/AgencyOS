import rateLimit from 'express-rate-limit'
import { Request, Response, NextFunction } from 'express'

// ─── Security event logger ────────────────────────────────────────────────────
export function logSecurityEvent(
  event: string,
  ip: string,
  details?: Record<string, unknown>,
): void {
  console.warn(
    `[SECURITY] ${JSON.stringify({ timestamp: new Date().toISOString(), event, ip, ...details })}`,
  )
}

export function logFailedLogin(ip: string, email: string): void {
  // Partially mask email before logging
  const masked = email.replace(/(?<=.{2}).(?=.*@)/g, '*')
  logSecurityEvent('LOGIN_FAILED', ip, { email: masked })
}

// ─── Rate limiters ────────────────────────────────────────────────────────────

// General: 100 req / 15 min per IP
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler(req, res) {
    logSecurityEvent('RATE_LIMIT_EXCEEDED', req.ip ?? 'unknown', { path: req.path })
    res.status(429).json({
      success: false,
      error: 'Demasiadas solicitudes. Por favor espera 15 minutos antes de intentarlo de nuevo.',
    })
  },
})

// Auth: 5 intentos / 15 min per IP
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler(req, res) {
    logSecurityEvent('AUTH_RATE_LIMIT_EXCEEDED', req.ip ?? 'unknown', { path: req.path })
    res.status(429).json({
      success: false,
      error: 'Demasiados intentos de acceso. Por favor espera 15 minutos antes de intentarlo de nuevo.',
    })
  },
})

// Content AI: 10 generaciones / hora por usuario autenticado
export const contentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => (req.user?.userId ?? req.ip ?? 'anonymous'),
  handler(req, res) {
    logSecurityEvent('CONTENT_RATE_LIMIT_EXCEEDED', req.ip ?? 'unknown', { userId: req.user?.userId })
    res.status(429).json({
      success: false,
      error: 'Has alcanzado el límite de 10 generaciones por hora. Disponible de nuevo en 1 hora.',
    })
  },
})

// Frameworks AI: 20 llamadas / hora per IP
export const frameworksLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler(req, res) {
    logSecurityEvent('FRAMEWORKS_RATE_LIMIT_EXCEEDED', req.ip ?? 'unknown', { path: req.path })
    res.status(429).json({
      success: false,
      error: 'Has alcanzado el límite de análisis IA por hora. Disponible de nuevo en 1 hora.',
    })
  },
})

// ─── Input sanitizer middleware ───────────────────────────────────────────────
export function sanitizeBody(req: Request, _res: Response, next: NextFunction): void {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeValue(req.body) as Record<string, unknown>
  }
  next()
}

function sanitizeValue(value: unknown): unknown {
  if (typeof value === 'string') {
    // Remove null bytes and non-printable control characters (keep tab, LF, CR)
    return value.replace(/\0/g, '').replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim()
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue)
  }
  if (value !== null && typeof value === 'object') {
    const result: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      result[k] = sanitizeValue(v)
    }
    return result
  }
  return value
}

// ─── Startup env validation ───────────────────────────────────────────────────
export function validateEnv(): void {
  let fatal = false

  const required: Record<string, string> = {
    JWT_SECRET:             'Clave secreta para firmar tokens JWT',
    DATABASE_URL:           'URL de conexión a la base de datos',
    STRIPE_WEBHOOK_SECRET:  'Secreto para verificar la firma de los webhooks de Stripe',
  }

  for (const [key, desc] of Object.entries(required)) {
    if (!process.env[key]) {
      console.error(`  ✗ ${key} — ${desc}`)
      fatal = true
    }
  }

  const jwtSecret = process.env.JWT_SECRET ?? ''
  if (jwtSecret && jwtSecret.length < 32) {
    console.error(`  ✗ JWT_SECRET debe tener mínimo 32 caracteres (actual: ${jwtSecret.length})`)
    fatal = true
  }

  if (fatal) {
    console.error('\n⛔  El servidor no puede arrancar: variables de entorno críticas faltantes.\n')
    process.exit(1)
  }

  const optional = ['ANTHROPIC_API_KEY', 'STRIPE_SECRET_KEY', 'STRIPE_PRICE_ID', 'FRONTEND_URL']
  const missing = optional.filter(k => !process.env[k])
  if (missing.length > 0) {
    console.warn(`  ⚠  Variables opcionales no configuradas: ${missing.join(', ')}`)
  }
}
