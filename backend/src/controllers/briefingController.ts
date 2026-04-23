import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import type { BriefingForm } from '../types'

const prisma = new PrismaClient()

export async function getBriefings(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId
  const briefings = await prisma.briefing.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })
  res.json({ success: true, data: briefings })
}

export async function getBriefing(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId
  const briefing = await prisma.briefing.findFirst({
    where: { id: req.params.id, userId },
  })
  if (!briefing) {
    res.status(404).json({ success: false, error: 'Briefing no encontrado' })
    return
  }
  res.json({ success: true, data: briefing })
}

export async function createBriefing(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId
  const body = req.body as Omit<BriefingForm, 'id' | 'createdAt'>
  if (!body.clientName || !body.projectName) {
    res.status(400).json({ success: false, error: 'clientName y projectName son requeridos' })
    return
  }
  const briefing = await prisma.briefing.create({
    data: {
      userId,
      clientName: body.clientName,
      brand: body.brand ?? '',
      projectName: body.projectName,
      projectType: body.projectType ?? '',
      objective: body.objective ?? '',
      targetAudience: body.targetAudience ?? '',
      ageRange: body.ageRange ?? '',
      location: body.location ?? '',
      keyMessage: body.keyMessage ?? '',
      tone: body.tone ?? '',
      mandatories: body.mandatories ?? '',
      restrictions: body.restrictions ?? '',
      deliverables: body.deliverables ?? '',
      startDate: body.startDate ?? '',
      endDate: body.endDate ?? '',
      budget: body.budget ?? '',
      competitors: body.competitors ?? '',
      references: body.references ?? '',
      additionalNotes: body.additionalNotes ?? '',
    },
  })
  res.status(201).json({ success: true, data: briefing })
}

export async function updateBriefing(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId
  const existing = await prisma.briefing.findFirst({
    where: { id: req.params.id, userId },
  })
  if (!existing) {
    res.status(404).json({ success: false, error: 'Briefing no encontrado' })
    return
  }
  const updated = await prisma.briefing.update({
    where: { id: req.params.id },
    data: req.body,
  })
  res.json({ success: true, data: updated })
}

export async function deleteBriefing(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId
  const existing = await prisma.briefing.findFirst({
    where: { id: req.params.id, userId },
  })
  if (!existing) {
    res.status(404).json({ success: false, error: 'Briefing no encontrado' })
    return
  }
  await prisma.briefing.delete({ where: { id: req.params.id } })
  res.json({ success: true, data: null })
}
