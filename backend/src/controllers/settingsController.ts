import { Request, Response } from 'express'
import { prisma } from '../models/User'

interface AgencySettings {
  name: string
  email: string
  website: string
  currency: string
  timezone: string
  language: string
}

export async function getSettings(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { agencySettings: true },
  })
  res.json({ success: true, data: (user?.agencySettings as unknown as AgencySettings) ?? null })
}

export async function updateSettings(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId
  const settings = req.body as Partial<AgencySettings>

  const allowed: (keyof AgencySettings)[] = ['name', 'email', 'website', 'currency', 'timezone', 'language']
  const clean: Partial<AgencySettings> = {}
  for (const key of allowed) {
    if (settings[key] !== undefined) clean[key] = settings[key]
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { agencySettings: clean },
    select: { agencySettings: true },
  })

  res.json({ success: true, data: user.agencySettings })
}
