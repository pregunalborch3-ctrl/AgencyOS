import crypto from 'crypto'
import { Request, Response } from 'express'
import { prisma } from '../models/User'

function generateApiKey(): { raw: string; hash: string; prefix: string } {
  const bytes = crypto.randomBytes(32).toString('hex')
  const raw   = `aos_sk_${bytes}`
  const hash  = crypto.createHash('sha256').update(raw).digest('hex')
  const prefix = raw.slice(0, 14) // 'aos_sk_' + first 7 hex chars
  return { raw, hash, prefix }
}

// ─── GET /api/apikeys ─────────────────────────────────────────────────────────
export async function listApiKeys(req: Request, res: Response): Promise<void> {
  const keys = await prisma.apiKey.findMany({
    where: { userId: req.user!.userId },
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, keyPrefix: true, lastUsed: true, createdAt: true },
  })
  res.json({ success: true, data: keys })
}

// ─── POST /api/apikeys ────────────────────────────────────────────────────────
export async function createApiKey(req: Request, res: Response): Promise<void> {
  const { name } = req.body as { name?: string }
  if (!name?.trim()) {
    res.status(400).json({ success: false, error: 'El nombre de la clave es requerido.' })
    return
  }

  const count = await prisma.apiKey.count({ where: { userId: req.user!.userId } })
  if (count >= 10) {
    res.status(400).json({ success: false, error: 'Máximo 10 claves API por cuenta.' })
    return
  }

  const { raw, hash, prefix } = generateApiKey()
  const key = await prisma.apiKey.create({
    data: {
      userId:    req.user!.userId,
      name:      name.trim(),
      keyHash:   hash,
      keyPrefix: prefix,
    },
    select: { id: true, name: true, keyPrefix: true, lastUsed: true, createdAt: true },
  })

  // rawKey is returned ONCE — never stored in plain text
  res.json({ success: true, data: { ...key, rawKey: raw } })
}

// ─── DELETE /api/apikeys/:id ──────────────────────────────────────────────────
export async function deleteApiKey(req: Request, res: Response): Promise<void> {
  const { id } = req.params
  const existing = await prisma.apiKey.findFirst({ where: { id, userId: req.user!.userId } })
  if (!existing) {
    res.status(404).json({ success: false, error: 'Clave no encontrada.' })
    return
  }
  await prisma.apiKey.delete({ where: { id } })
  res.json({ success: true })
}
