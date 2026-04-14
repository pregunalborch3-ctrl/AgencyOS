import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { v4 as uuid } from 'uuid'
import { UserStore, User } from '../models/User'
import type { JwtPayload } from '../middleware/authMiddleware'

const BCRYPT_ROUNDS = 12

// ── Validation helpers ────────────────────────────────────────────────────────
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

interface PasswordCheck {
  valid: boolean
  errors: string[]
}
function checkPasswordStrength(password: string): PasswordCheck {
  const errors: string[] = []
  if (password.length < 8)        errors.push('Mínimo 8 caracteres.')
  if (!/[A-Z]/.test(password))    errors.push('Al menos una letra mayúscula.')
  if (!/[0-9]/.test(password))    errors.push('Al menos un número.')
  if (!/[^A-Za-z0-9]/.test(password)) errors.push('Al menos un carácter especial (!@#$%...).')
  return { valid: errors.length === 0, errors }
}

function signToken(user: User): string {
  const payload: JwtPayload = {
    userId: user.id,
    email:  user.email,
    name:   user.name,
    role:   user.role,
  }
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: (process.env.JWT_EXPIRES_IN ?? '7d') as jwt.SignOptions['expiresIn'],
  })
}

// ── Controllers ───────────────────────────────────────────────────────────────
export async function register(req: Request, res: Response): Promise<void> {
  const { name, email, password, confirmPassword } = req.body as {
    name?: string; email?: string; password?: string; confirmPassword?: string
  }

  // Field presence
  if (!name?.trim() || !email?.trim() || !password || !confirmPassword) {
    res.status(400).json({ success: false, error: 'Todos los campos son obligatorios.' })
    return
  }

  // Name length
  if (name.trim().length < 2) {
    res.status(400).json({ success: false, error: 'El nombre debe tener al menos 2 caracteres.' })
    return
  }

  // Email format
  if (!isValidEmail(email)) {
    res.status(400).json({ success: false, error: 'El formato del email no es válido.' })
    return
  }

  // Email uniqueness
  if (UserStore.findByEmail(email)) {
    res.status(409).json({ success: false, error: 'Ya existe una cuenta con ese email.' })
    return
  }

  // Password strength
  const strength = checkPasswordStrength(password)
  if (!strength.valid) {
    res.status(400).json({ success: false, error: strength.errors.join(' ') })
    return
  }

  // Passwords match
  if (password !== confirmPassword) {
    res.status(400).json({ success: false, error: 'Las contraseñas no coinciden.' })
    return
  }

  // Create user
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS)
  const user = UserStore.create({
    id:               uuid(),
    name:             name.trim(),
    email:            email.toLowerCase().trim(),
    passwordHash,
    role:             'member',
    createdAt:        new Date().toISOString(),
    lastLoginAt:      null,
    stripeCustomerId: null,
    subscription:     null,
  })

  const token = signToken(user)
  res.status(201).json({
    success: true,
    data: { token, user: UserStore.toPublic(user) },
  })
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body as { email?: string; password?: string }

  if (!email?.trim() || !password) {
    res.status(400).json({ success: false, error: 'Email y contraseña son obligatorios.' })
    return
  }

  const user = UserStore.findByEmail(email)
  if (!user) {
    // Deliberate constant-time-ish response to prevent email enumeration
    await bcrypt.compare(password, '$2a$12$invalidhashplaceholder000000000000000000000000')
    res.status(401).json({ success: false, error: 'Credenciales incorrectas.' })
    return
  }

  const match = await bcrypt.compare(password, user.passwordHash)
  if (!match) {
    res.status(401).json({ success: false, error: 'Credenciales incorrectas.' })
    return
  }

  UserStore.update(user.id, { lastLoginAt: new Date().toISOString() })
  const token = signToken(user)

  res.json({
    success: true,
    data: { token, user: UserStore.toPublic(user) },
  })
}

export function me(req: Request, res: Response): void {
  const user = UserStore.findById(req.user!.userId)
  if (!user) {
    res.status(404).json({ success: false, error: 'Usuario no encontrado.' })
    return
  }
  res.json({ success: true, data: UserStore.toPublic(user) })
}
