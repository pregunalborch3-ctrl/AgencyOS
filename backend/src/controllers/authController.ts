import { Request, Response } from "express"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { v4 as uuid } from "uuid"
import { UserStore, User } from "../models/User"
import type { JwtPayload } from "../middleware/authMiddleware"
import { logFailedLogin } from "../middleware/security"

const BCRYPT_ROUNDS = 12

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

function signToken(user: User): string {
  const payload: JwtPayload = {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  }
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: (process.env.JWT_EXPIRES_IN ?? "7d") as jwt.SignOptions["expiresIn"],
  })
}

export async function register(req: Request, res: Response): Promise<void> {
  const { name, email, password, confirmPassword } = req.body as {
    name?: string; email?: string; password?: string; confirmPassword?: string
  }

  if (!name?.trim() || !email?.trim() || !password || !confirmPassword) {
    res.status(400).json({ success: false, error: "Todos los campos son obligatorios." })
    return
  }
  if (name.trim().length < 2) {
    res.status(400).json({ success: false, error: "El nombre debe tener al menos 2 caracteres." })
    return
  }
  if (!isValidEmail(email)) {
    res.status(400).json({ success: false, error: "El formato del email no es valido." })
    return
  }
  if (await UserStore.findByEmail(email)) {
    res.status(409).json({ success: false, error: "Ya existe una cuenta con ese email." })
    return
  }
  if (password !== confirmPassword) {
    res.status(400).json({ success: false, error: "Las contrasenas no coinciden." })
    return
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS)
  const user = await UserStore.create({
    id: uuid(),
    name: name.trim(),
    email: email.toLowerCase().trim(),
    passwordHash,
    role: "member",
    stripeCustomerId: null,
    subscription: null,
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
    res.status(400).json({ success: false, error: "Email y contrasena son obligatorios." })
    return
  }

  const ip = req.ip ?? req.socket.remoteAddress ?? 'unknown'

  const user = await UserStore.findByEmail(email)
  if (!user) {
    await bcrypt.compare(password, "$2a$12$invalidhashplaceholder00000000000000000000")
    logFailedLogin(ip, email)
    res.status(401).json({ success: false, error: "Credenciales incorrectas." })
    return
  }

  const match = await bcrypt.compare(password, user.passwordHash)
  if (!match) {
    logFailedLogin(ip, email)
    res.status(401).json({ success: false, error: "Credenciales incorrectas." })
    return
  }

  await UserStore.update(user.id, { lastLoginAt: new Date().toISOString() })
  const token = signToken(user)
  res.json({
    success: true,
    data: { token, user: UserStore.toPublic(user) },
  })
}

export function me(req: Request, res: Response): void {
  UserStore.findById(req.user!.userId).then(user => {
    if (!user) {
      res.status(404).json({ success: false, error: "Usuario no encontrado." })
      return
    }
    res.json({ success: true, data: UserStore.toPublic(user) })
  })
}
