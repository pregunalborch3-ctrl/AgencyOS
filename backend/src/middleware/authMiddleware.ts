import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { UserStore } from '../models/User'

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

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Token de autenticación requerido.' })
    return
  }

  const token = header.slice(7)
  try {
    const secret = process.env.JWT_SECRET!
    const payload = jwt.verify(token, secret) as JwtPayload
    // Ensure user still exists
    const user = UserStore.findById(payload.userId)
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
