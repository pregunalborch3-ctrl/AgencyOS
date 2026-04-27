import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function getCompetitors(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId
  const competitors = await prisma.competitor.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })
  res.json({ success: true, data: competitors })
}

export async function getCompetitor(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId
  const competitor = await prisma.competitor.findFirst({ where: { id: req.params.id, userId } })
  if (!competitor) {
    res.status(404).json({ success: false, error: 'Competidor no encontrado' })
    return
  }
  res.json({ success: true, data: competitor })
}

export async function createCompetitor(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId
  const { name, url, notes } = req.body
  if (!name) {
    res.status(400).json({ success: false, error: 'name es requerido' })
    return
  }
  const competitor = await prisma.competitor.create({
    data: { userId, name, url: url ?? null, notes: notes ?? null },
  })
  res.status(201).json({ success: true, data: competitor })
}

const COMPETITOR_ALLOWED = ['name', 'url', 'notes'] as const

export async function updateCompetitor(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId
  const existing = await prisma.competitor.findFirst({ where: { id: req.params.id, userId } })
  if (!existing) {
    res.status(404).json({ success: false, error: 'Competidor no encontrado' })
    return
  }
  const body = req.body as Record<string, unknown>
  const clean: Record<string, unknown> = {}
  for (const key of COMPETITOR_ALLOWED) {
    if (body[key] !== undefined) clean[key] = body[key]
  }
  const updated = await prisma.competitor.update({
    where: { id: req.params.id },
    data: clean,
  })
  res.json({ success: true, data: updated })
}

export async function deleteCompetitor(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId
  const existing = await prisma.competitor.findFirst({ where: { id: req.params.id, userId } })
  if (!existing) {
    res.status(404).json({ success: false, error: 'Competidor no encontrado' })
    return
  }
  await prisma.competitor.delete({ where: { id: req.params.id } })
  res.json({ success: true, data: null })
}
