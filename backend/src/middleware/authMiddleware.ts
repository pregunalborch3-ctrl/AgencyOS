import crypto from 'crypto'
import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { UserStore, prisma } from '../models/User'

export interface JwtPayload {
  userId: string
  email: string
  name: string
  role: string
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
    req.user = payload
    next()
  } catch {
    res.status(401).json({ success: false, error: 'Token inválido o expirado.' })
  }
}
