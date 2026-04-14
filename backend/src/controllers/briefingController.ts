import { Request, Response } from 'express'
import { v4 as uuid } from 'uuid'
import type { BriefingForm } from '../types'

const briefings: BriefingForm[] = []

export function getBriefings(_req: Request, res: Response): void {
  res.json({ success: true, data: briefings })
}

export function getBriefing(req: Request, res: Response): void {
  const b = briefings.find((x) => x.id === req.params.id)
  if (!b) {
    res.status(404).json({ success: false, error: 'Briefing no encontrado' })
    return
  }
  res.json({ success: true, data: b })
}

export function createBriefing(req: Request, res: Response): void {
  const body = req.body as Omit<BriefingForm, 'id' | 'createdAt'>
  if (!body.clientName || !body.projectName) {
    res.status(400).json({ success: false, error: 'clientName y projectName son requeridos' })
    return
  }
  const briefing: BriefingForm = { ...body, id: uuid(), createdAt: new Date().toISOString() }
  briefings.push(briefing)
  res.status(201).json({ success: true, data: briefing })
}

export function updateBriefing(req: Request, res: Response): void {
  const idx = briefings.findIndex((b) => b.id === req.params.id)
  if (idx === -1) {
    res.status(404).json({ success: false, error: 'Briefing no encontrado' })
    return
  }
  briefings[idx] = { ...briefings[idx], ...req.body, id: req.params.id }
  res.json({ success: true, data: briefings[idx] })
}

export function deleteBriefing(req: Request, res: Response): void {
  const idx = briefings.findIndex((b) => b.id === req.params.id)
  if (idx === -1) {
    res.status(404).json({ success: false, error: 'Briefing no encontrado' })
    return
  }
  briefings.splice(idx, 1)
  res.json({ success: true, data: null })
}
