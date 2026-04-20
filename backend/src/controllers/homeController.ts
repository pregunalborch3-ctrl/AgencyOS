import { Request, Response } from 'express'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()

// In-memory cache: one tip per calendar day
let tipCache: { date: string; tip: string } | null = null

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

export async function getDailyTip(req: Request, res: Response): Promise<void> {
  try {
    const today = todayKey()

    if (tipCache?.date === today) {
      res.json({ success: true, data: { tip: tipCache.tip } })
      return
    }

    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 120,
      messages: [{
        role: 'user',
        content: 'Dame un consejo de marketing digital breve y accionable para agencias que gestionan campañas de Meta Ads y TikTok. Máximo 2 frases cortas. En español. Solo el consejo, sin introducción ni comillas.',
      }],
    })

    const tip = (msg.content[0] as { type: string; text: string }).text.trim()
    tipCache = { date: today, tip }

    res.json({ success: true, data: { tip } })
  } catch {
    // Fallback tip if Claude is unavailable
    res.json({
      success: true,
      data: { tip: 'Prueba 3 hooks distintos en los primeros 3 segundos de cada ad — ese momento decide el 80% del CTR. Rota el ganador cada semana.' },
    })
  }
}
