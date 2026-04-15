import { Request, Response } from 'express'
import { v4 as uuid } from 'uuid'
import Anthropic from '@anthropic-ai/sdk'
import type { ContentRequest, GeneratedContent } from '../types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const history: GeneratedContent[] = []

async function generateWithClaude(body: ContentRequest): Promise<string> {
  const prompt = `Eres un experto en marketing digital y redes sociales.
Genera un caption profesional y atractivo para ${body.platform} con estas características:
- Marca: ${body.brand}
- Tema: ${body.topic}
- Tono: ${body.tone || 'profesional y cercano'}
- Keywords/hashtags: ${body.keywords}
- Call to action: ${body.callToAction || 'genérico apropiado'}

El caption debe:
- Ser natural y no genérico
- Incluir emojis relevantes
- Terminar con hashtags
- Estar optimizado para ${body.platform}
- Tener entre 100-300 caracteres (sin hashtags)

Responde SOLO con el caption, sin explicaciones.`

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    messages: [{ role: 'user', content: prompt }],
  })

  return (message.content[0] as { text: string }).text
}

export async function generateContent(req: Request, res: Response): Promise<void> {
  const body = req.body as ContentRequest

  if (!body.topic || !body.brand || !body.platform) {
    res.status(400).json({ success: false, error: 'topic, brand y platform son requeridos' })
    return
  }

  try {
    const captions = await Promise.all([
      generateWithClaude(body),
      generateWithClaude(body),
      generateWithClaude(body),
    ])

    const variations = captions.map((caption) => {
      const item: GeneratedContent = {
        id: uuid(),
        caption,
        hashtags: body.keywords.split(',').map((k) => k.trim().replace(/\s/g, '')).filter(Boolean),
        platform: body.platform,
        createdAt: new Date().toISOString(),
      }
      history.push(item)
      return item
    })

    res.json({ success: true, data: variations })
  } catch (error) {
    console.error('Error generando contenido con Claude:', error)
    res.status(500).json({ success: false, error: 'Error al generar contenido con IA' })
  }
}

export function getContentHistory(_req: Request, res: Response): void {
  res.json({ success: true, data: history.slice(-50) })
}
