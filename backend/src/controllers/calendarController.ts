import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function getPosts(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId
  const posts = await prisma.calendarPost.findMany({
    where: { userId },
    orderBy: { date: 'asc' },
  })
  res.json({ success: true, data: posts })
}

export async function createPost(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId
  const { title, date, platform, content, status } = req.body
  if (!title || !date || !platform || !content) {
    res.status(400).json({ success: false, error: 'title, date, platform y content son requeridos' })
    return
  }
  const post = await prisma.calendarPost.create({
    data: { userId, title, date, platform, content, status: status ?? 'draft' },
  })
  res.status(201).json({ success: true, data: post })
}

const CALENDAR_ALLOWED = ['title', 'date', 'platform', 'content', 'status'] as const

export async function updatePost(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId
  const existing = await prisma.calendarPost.findFirst({ where: { id: req.params.id, userId } })
  if (!existing) {
    res.status(404).json({ success: false, error: 'Post no encontrado' })
    return
  }
  const body = req.body as Record<string, unknown>
  const clean: Record<string, unknown> = {}
  for (const key of CALENDAR_ALLOWED) {
    if (body[key] !== undefined) clean[key] = body[key]
  }
  const updated = await prisma.calendarPost.update({
    where: { id: req.params.id },
    data: clean,
  })
  res.json({ success: true, data: updated })
}

export async function deletePost(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId
  const existing = await prisma.calendarPost.findFirst({ where: { id: req.params.id, userId } })
  if (!existing) {
    res.status(404).json({ success: false, error: 'Post no encontrado' })
    return
  }
  await prisma.calendarPost.delete({ where: { id: req.params.id } })
  res.json({ success: true, data: null })
}
