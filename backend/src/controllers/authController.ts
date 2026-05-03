import { Request, Response } from "express"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { v4 as uuid } from "uuid"
import crypto from "crypto"
import { UserStore, User, prisma } from "../models/User"
import type { JwtPayload } from "../middleware/authMiddleware"
import { logFailedLogin } from "../middleware/security"
import { sendWelcomeEmail, sendPasswordResetEmail } from "../services/emailService"

const BCRYPT_ROUNDS = 12

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

function signToken(user: User, expiresIn: string = process.env.JWT_EXPIRES_IN ?? "7d"): string {
  const pwv = crypto.createHash("sha256").update(user.passwordHash).digest("hex").slice(0, 16)
  const payload: JwtPayload = {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    pwv,
  }
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: expiresIn as jwt.SignOptions["expiresIn"],
  })
}

export async function register(req: Request, res: Response): Promise<void> {
  try {
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
    if (
      password.length < 8 ||
      !/[A-Z]/.test(password) ||
      !/[0-9]/.test(password) ||
      !/[^A-Za-z0-9]/.test(password)
    ) {
      res.status(400).json({ success: false, error: "La contraseña no cumple los requisitos de seguridad (mínimo 8 caracteres, una mayúscula, un número y un carácter especial)." })
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
      freeUsed: false,
      onboardingDone: false,
    })

    const token = signToken(user, "30d")
    res.status(201).json({
      success: true,
      data: { token, user: UserStore.toPublic(user) },
    })
  } catch (err) {
    console.error("[register] Error inesperado:", err)
    res.status(500).json({ success: false, error: "Error al crear la cuenta. Por favor inténtalo de nuevo." })
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
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
    const token = signToken(user, "30d")
    res.json({
      success: true,
      data: { token, user: UserStore.toPublic(user) },
    })
  } catch (err) {
    console.error("[login] Error inesperado:", err)
    res.status(500).json({ success: false, error: "Error al iniciar sesión. Por favor inténtalo de nuevo." })
  }
}

export async function markOnboardingDone(req: Request, res: Response): Promise<void> {
  try {
    const { agencyName, clientType, primaryGoal } = req.body as {
      agencyName?: string; clientType?: string; primaryGoal?: string
    }

    const existing = await UserStore.findById(req.user!.userId)
    if (!existing) {
      res.status(404).json({ success: false, error: "Usuario no encontrado." })
      return
    }
    const isFirstTime = !existing.onboardingDone

    const settings: Record<string, string> = {}
    if (agencyName?.trim()) settings.agencyName = agencyName.trim()
    if (clientType)         settings.clientType = clientType
    if (primaryGoal)        settings.primaryGoal = primaryGoal

    await UserStore.update(req.user!.userId, {
      onboardingDone: true,
      ...(Object.keys(settings).length ? { agencySettings: settings } : {}),
    })
    res.json({ success: true, data: { onboardingDone: true } })

    if (isFirstTime) {
      const displayName = agencyName?.trim() || existing.name
      sendWelcomeEmail(existing.email, displayName).catch((err: unknown) => {
        console.error("[markOnboardingDone] Fallo al enviar email de bienvenida:", err)
      })
    }
  } catch {
    res.status(500).json({ success: false, error: "Error al actualizar el onboarding." })
  }
}

export async function me(req: Request, res: Response): Promise<void> {
  try {
    const user = await UserStore.findById(req.user!.userId)
    if (!user) {
      res.status(404).json({ success: false, error: "Usuario no encontrado." })
      return
    }
    res.json({ success: true, data: UserStore.toPublic(user) })
  } catch {
    res.status(500).json({ success: false, error: "Error al obtener el usuario." })
  }
}

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  try {
    const { email } = req.body as { email?: string }

    if (!email?.trim() || !isValidEmail(email)) {
      res.status(400).json({ success: false, error: "El formato del email no es válido." })
      return
    }

    // Always respond the same to avoid user enumeration
    const SAFE_RESPONSE = { success: true, data: { message: "Si ese email existe, recibirás un enlace en breve." } }

    const user = await UserStore.findByEmail(email)
    if (!user) {
      res.json(SAFE_RESPONSE)
      return
    }

    // Invalidate any existing unused tokens for this user
    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, used: false },
      data:  { used: true },
    })

    const rawToken = crypto.randomBytes(32).toString("hex")
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex")
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    await prisma.passwordResetToken.create({
      data: { id: uuid(), userId: user.id, tokenHash, expiresAt },
    })

    const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:5173"
    const resetUrl = `${frontendUrl}/reset-password?token=${rawToken}`

    sendPasswordResetEmail(user.email, user.name, resetUrl).catch((err: unknown) => {
      console.error("[forgotPassword] Error enviando email de reset:", err)
    })

    res.json(SAFE_RESPONSE)
  } catch (err) {
    console.error("[forgotPassword] Error inesperado:", err)
    res.status(500).json({ success: false, error: "Error al procesar la solicitud. Por favor inténtalo de nuevo." })
  }
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  try {
    const { token, password, confirmPassword } = req.body as {
      token?: string; password?: string; confirmPassword?: string
    }

    if (!token?.trim() || !password || !confirmPassword) {
      res.status(400).json({ success: false, error: "Todos los campos son obligatorios." })
      return
    }
    if (password !== confirmPassword) {
      res.status(400).json({ success: false, error: "Las contraseñas no coinciden." })
      return
    }
    if (password.length < 8) {
      res.status(400).json({ success: false, error: "La contraseña debe tener mínimo 8 caracteres." })
      return
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex")
    const resetToken = await prisma.passwordResetToken.findUnique({ where: { tokenHash } })

    if (!resetToken || resetToken.used || resetToken.expiresAt < new Date()) {
      res.status(400).json({ success: false, error: "El enlace no es válido o ha caducado. Solicita uno nuevo." })
      return
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS)

    await prisma.user.update({
      where: { id: resetToken.userId },
      data:  { passwordHash },
    })

    await prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data:  { used: true },
    })

    res.json({ success: true, data: { message: "Contraseña actualizada correctamente. Ya puedes iniciar sesión." } })
  } catch (err) {
    console.error("[resetPassword] Error inesperado:", err)
    res.status(500).json({ success: false, error: "Error al restablecer la contraseña. Por favor inténtalo de nuevo." })
  }
}
