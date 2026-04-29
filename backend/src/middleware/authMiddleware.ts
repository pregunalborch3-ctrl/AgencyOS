import crypto from 'crypto'
import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { UserStore, prisma } from '../models/User'

export interface JwtPayload {
  userId: string
  email: string
  name: string
  role: string
  pwv?: string  // password version — first 16 hex chars of SHA-256(passwordHash); absent for API key auth
}

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload
    }
  }
}

// ─── API Key middleware (for Enterprise/programmatic access) ──────────────────
export async function requireApiKey(req: Request, res: Response, next: NextFunction): Promise<void> {
  const apiKey = req.headers['x-api-key'] as string | undefined
  if (!apiKey?.startsWith('aos_sk_')) {
    res.status(401).json({ success: false, error: 'API key requerida. Usa el header X-API-Key.' })
    return
  }

  try {
    const hash   = crypto.createHash('sha256').update(apiKey).digest('hex')
    const record = await prisma.apiKey.findUnique({ where: { keyHash: hash } })
    if (!record) {
      res.status(401).json({ success: false, error: 'API key inválida.' })
      return
    }

    // fire-and-forget lastUsed update
    prisma.apiKey.update({ where: { id: record.id }, data: { lastUsed: new Date() } }).catch(() => {})

    const user = await UserStore.findById(record.userId)
    if (!user) {
      res.status(401).json({ success: false, error: 'Usuario no encontrado.' })
      return
    }

    req.user = { userId: user.id, email: user.email, name: user.name, role: user.role }
    next()
  } catch {
    res.status(500).json({ success: false, error: 'Error validando API key.' })
  }
}

export async function requireSubscription(req: Request, res: Response, next: NextFunction): Promise<void> {
  const user = await UserStore.findById(req.user!.userId)
  if (!user) {
    res.status(401).json({ success: false, error: 'Usuario no encontrado.' })
    return
  }
  const status = user.subscription?.status
  const isActive = status === 'active' || status === 'trialing' || user.role === 'admin'
  if (!isActive) {
    res.status(403).json({ success: false, error: 'Esta función requiere una suscripción activa.' })
    return
  }
  next()
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Token de autenticación requerido.' })
    return
  }

  const token = header.slice(7)
  try {
    const secret = process.env.JWT_SECRET!
    const payload = jwt.verify(token, secret) as JwtPayload
    const user = await UserStore.findById(payload.userId)
    if (!user) {
      res.status(401).json({ success: false, error: 'Usuario no encontrado.' })
      return
    }
    // Invalidate tokens issued before a password change
    const currentPwv = crypto.createHash('sha256').update(user.passwordHash).digest('hex').slice(0, 16)
    if (payload.pwv && payload.pwv !== currentPwv) {
      res.status(401).json({ success: false, error: 'Sesión inválida. Por favor inicia sesión de nuevo.' })
      return
    }
    req.user = payload
    next()
  } catch {
    res.status(401).json({ success: false, error: 'Token inválido o expirado.' })
  }
}
