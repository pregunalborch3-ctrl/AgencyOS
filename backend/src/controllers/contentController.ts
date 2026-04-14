import { Request, Response } from 'express'
import { v4 as uuid } from 'uuid'
import type { ContentRequest, GeneratedContent } from '../types'

// In-memory store (replace with DB in production)
const history: GeneratedContent[] = []

function buildCaption(req: ContentRequest): string {
  const ctas = req.callToAction
    ? [req.callToAction]
    : ['Descúbrelo ahora.', 'Contáctanos hoy.', '¡No te lo pierdas!']
  const cta = ctas[Math.floor(Math.random() * ctas.length)]
  const keywords = req.keywords.split(',').map((k) => k.trim()).filter(Boolean)
  const hashtags = keywords.map((k) => `#${k.replace(/\s/g, '')}`).join(' ')

  const templates = [
    `¡${req.brand} lo hace de nuevo! 🚀\n\n${req.topic} — la oportunidad que estabas esperando.\n\n${cta}\n\n${hashtags}`,
    `Hablemos de ${req.topic.toLowerCase()} ✨\n\nEn ${req.brand} creemos en resultados reales. Cada acción cuenta, cada detalle importa.\n\n${cta}\n\n${hashtags}`,
    `${req.topic} — más que una tendencia, una necesidad. 💡\n\nDesde ${req.brand} te acompañamos en cada paso.\n\n${cta}\n\n${hashtags}`,
  ]

  return templates[Math.floor(Math.random() * templates.length)]
}

export function generateContent(req: Request, res: Response): void {
  const body = req.body as ContentRequest

  if (!body.topic || !body.brand || !body.platform) {
    res.status(400).json({ success: false, error: 'topic, brand y platform son requeridos' })
    return
  }

  const variations = Array.from({ length: 3 }, () => {
    const item: GeneratedContent = {
      id: uuid(),
      caption: buildCaption(body),
      hashtags: body.keywords.split(',').map((k) => k.trim().replace(/\s/g, '')).filter(Boolean),
      platform: body.platform,
      createdAt: new Date().toISOString(),
    }
    history.push(item)
    return item
  })

  res.json({ success: true, data: variations })
}

export function getContentHistory(_req: Request, res: Response): void {
  res.json({ success: true, data: history.slice(-50) })
}
