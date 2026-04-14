import { Request, Response } from 'express'
import { v4 as uuid } from 'uuid'
import type { Competitor } from '../types'

const competitors: Competitor[] = []

export function getCompetitors(_req: Request, res: Response): void {
  res.json({ success: true, data: competitors })
}

export function getCompetitor(req: Request, res: Response): void {
  const c = competitors.find((x) => x.id === req.params.id)
  if (!c) {
    res.status(404).json({ success: false, error: 'Competidor no encontrado' })
    return
  }
  res.json({ success: true, data: c })
}

export function createCompetitor(req: Request, res: Response): void {
  const body = req.body as Omit<Competitor, 'id' | 'createdAt'>
  if (!body.name) {
    res.status(400).json({ success: false, error: 'name es requerido' })
    return
  }
  const competitor: Competitor = {
    ...body,
    id: uuid(),
    createdAt: new Date().toISOString(),
  }
  competitors.push(competitor)
  res.status(201).json({ success: true, data: competitor })
}

export function updateCompetitor(req: Request, res: Response): void {
  const idx = competitors.findIndex((c) => c.id === req.params.id)
  if (idx === -1) {
    res.status(404).json({ success: false, error: 'Competidor no encontrado' })
    return
  }
  competitors[idx] = { ...competitors[idx], ...req.body, id: req.params.id }
  res.json({ success: true, data: competitors[idx] })
}

export function deleteCompetitor(req: Request, res: Response): void {
  const idx = competitors.findIndex((c) => c.id === req.params.id)
  if (idx === -1) {
    res.status(404).json({ success: false, error: 'Competidor no encontrado' })
    return
  }
  competitors.splice(idx, 1)
  res.json({ success: true, data: null })
}
