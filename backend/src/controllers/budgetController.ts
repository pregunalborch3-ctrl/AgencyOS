import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import type { Budget } from '../types'

const prisma = new PrismaClient()

export async function getBudgets(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId
  const budgets = await prisma.budget.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })
  res.json({ success: true, data: budgets })
}

export async function getBudget(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId
  const budget = await prisma.budget.findFirst({
    where: { id: req.params.id, userId },
  })
  if (!budget) {
    res.status(404).json({ success: false, error: 'Presupuesto no encontrado' })
    return
  }
  res.json({ success: true, data: budget })
}

export async function createBudget(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId
  const body = req.body as Omit<Budget, 'id' | 'createdAt'>
  if (!body.projectName) {
    res.status(400).json({ success: false, error: 'projectName es requerido' })
    return
  }
  const budget = await prisma.budget.create({
    data: {
      userId,
      projectName: body.projectName,
      client: body.client ?? '',
      currency: body.currency ?? 'EUR',
      items: (body.items ?? []) as object[],
      agencyFeePercent: body.agencyFeePercent ?? 0,
      taxPercent: body.taxPercent ?? 0,
      notes: body.notes ?? '',
    },
  })
  res.status(201).json({ success: true, data: budget })
}

const BUDGET_ALLOWED = ['projectName', 'client', 'currency', 'items', 'agencyFeePercent', 'taxPercent', 'notes'] as const

export async function updateBudget(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId
  const existing = await prisma.budget.findFirst({
    where: { id: req.params.id, userId },
  })
  if (!existing) {
    res.status(404).json({ success: false, error: 'Presupuesto no encontrado' })
    return
  }
  const body = req.body as Record<string, unknown>
  const clean: Record<string, unknown> = {}
  for (const key of BUDGET_ALLOWED) {
    if (body[key] !== undefined) clean[key] = body[key]
  }
  const updated = await prisma.budget.update({
    where: { id: req.params.id },
    data: clean,
  })
  res.json({ success: true, data: updated })
}

export async function deleteBudget(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId
  const existing = await prisma.budget.findFirst({
    where: { id: req.params.id, userId },
  })
  if (!existing) {
    res.status(404).json({ success: false, error: 'Presupuesto no encontrado' })
    return
  }
  await prisma.budget.delete({ where: { id: req.params.id } })
  res.json({ success: true, data: null })
}
