import { Request, Response } from 'express'
import { v4 as uuid } from 'uuid'
import type { Budget } from '../types'

const budgets: Budget[] = []

export function getBudgets(_req: Request, res: Response): void {
  res.json({ success: true, data: budgets })
}

export function getBudget(req: Request, res: Response): void {
  const budget = budgets.find((b) => b.id === req.params.id)
  if (!budget) {
    res.status(404).json({ success: false, error: 'Presupuesto no encontrado' })
    return
  }
  res.json({ success: true, data: budget })
}

export function createBudget(req: Request, res: Response): void {
  const body = req.body as Omit<Budget, 'id' | 'createdAt'>
  if (!body.projectName) {
    res.status(400).json({ success: false, error: 'projectName es requerido' })
    return
  }
  const budget: Budget = { ...body, id: uuid(), createdAt: new Date().toISOString() }
  budgets.push(budget)
  res.status(201).json({ success: true, data: budget })
}

export function updateBudget(req: Request, res: Response): void {
  const idx = budgets.findIndex((b) => b.id === req.params.id)
  if (idx === -1) {
    res.status(404).json({ success: false, error: 'Presupuesto no encontrado' })
    return
  }
  budgets[idx] = { ...budgets[idx], ...req.body, id: req.params.id }
  res.json({ success: true, data: budgets[idx] })
}

export function deleteBudget(req: Request, res: Response): void {
  const idx = budgets.findIndex((b) => b.id === req.params.id)
  if (idx === -1) {
    res.status(404).json({ success: false, error: 'Presupuesto no encontrado' })
    return
  }
  budgets.splice(idx, 1)
  res.json({ success: true, data: null })
}
