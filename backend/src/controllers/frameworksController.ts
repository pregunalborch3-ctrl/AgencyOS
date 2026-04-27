import { Request, Response } from 'express'
import Anthropic from '@anthropic-ai/sdk'

// ─── Lazy client — lee process.env en el momento de la llamada, no al importar ─
function getClient(): Anthropic {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) {
    throw new Error('ANTHROPIC_API_KEY no está configurada en las variables de entorno del servidor.')
  }
  return new Anthropic({ apiKey: key })
}

// ─── Shared helper ────────────────────────────────────────────────────────────
const CLAUDE_TIMEOUT_MS = 90_000

async function claudeJSON<T>(system: string, user: string): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(
      () => reject(new Error('La IA tardó demasiado. Por favor, inténtalo de nuevo.')),
      CLAUDE_TIMEOUT_MS,
    ),
  )
  const msg = await Promise.race([
    getClient().messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      system,
      messages: [{ role: 'user', content: user }],
    }),
    timeout,
  ])

  if (msg.stop_reason === 'max_tokens') {
    console.error('[claudeJSON/fw] stop_reason=max_tokens. usage:', msg.usage)
    throw new Error('La respuesta de la IA fue demasiado larga. Inténtalo de nuevo.')
  }

  const raw = (msg.content[0] as { type: string; text: string }).text.trim()
  const first = raw.indexOf('{')
  const last  = raw.lastIndexOf('}')
  if (first === -1 || last === -1) {
    console.error('[claudeJSON/fw] No JSON object found. raw:', raw.slice(0, 300))
    throw new Error('La IA devolvió una respuesta inesperada. Por favor, inténtalo de nuevo.')
  }
  const clean = raw.slice(first, last + 1)
  try {
    return JSON.parse(clean) as T
  } catch {
    console.error('[claudeJSON/fw] JSON.parse failed. stop_reason:', msg.stop_reason, 'usage:', msg.usage, 'raw:', raw.slice(0, 500))
    throw new Error('La IA devolvió una respuesta inesperada. Por favor, inténtalo de nuevo.')
  }
}

// ─── Framework 1: Análisis de Mercado ─────────────────────────────────────────
export async function analyzeMarket(req: Request, res: Response): Promise<void> {
  try {
    const { nicho } = req.body
    if (!nicho?.trim()) {
      res.status(400).json({ success: false, error: 'El campo "nicho" es obligatorio.' })
      return
    }

    const data = await claudeJSON(
      'Eres un analista de mercado experto en e-commerce y marketing digital. Responde ÚNICAMENTE con JSON válido, sin markdown, sin comentarios.',
      `Analiza este nicho de mercado: "${nicho}"

Devuelve EXACTAMENTE este JSON:
{
  "tam": { "value": "€Xmm", "description": "descripción del mercado total en 1 frase" },
  "sam": { "value": "€Xmm", "description": "descripción del mercado servible en 1 frase" },
  "som": { "value": "€Xmm", "description": "descripción del mercado obtenible en 1 frase" },
  "trends": [
    { "title": "...", "description": "descripción en 2 frases", "impact": "alto|medio|bajo" }
  ],
  "opportunities": [
    { "title": "...", "description": "descripción en 2 frases", "action": "acción concreta recomendada" }
  ]
}

Genera exactamente 5 tendencias y 5 oportunidades. Valores en euros. Responde en español.`
    )

    res.json({ success: true, data })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('analyzeMarket:', msg)
    res.status(500).json({ success: false, error: msg })
  }
}

// ─── Framework 2: Mapa de Competencia ─────────────────────────────────────────
export async function mapCompetition(req: Request, res: Response): Promise<void> {
  try {
    const { competitors, industry } = req.body as { competitors: string[]; industry: string }
    if (!competitors?.length || !industry?.trim()) {
      res.status(400).json({ success: false, error: 'Se requieren competidores e industria.' })
      return
    }

    const data = await claudeJSON(
      'Eres un analista de competencia experto en estrategia de negocio y marketing. Responde ÚNICAMENTE con JSON válido, sin markdown.',
      `Analiza estos competidores en la industria "${industry}": ${competitors.filter(Boolean).join(', ')}

Devuelve EXACTAMENTE este JSON:
{
  "competitors": [
    {
      "name": "nombre del competidor",
      "strengths": ["fortaleza 1", "fortaleza 2", "fortaleza 3"],
      "weaknesses": ["debilidad 1", "debilidad 2", "debilidad 3"],
      "gap": "brecha principal que deja al descubierto",
      "positioning": "cómo se posicionan en el mercado en 1 frase"
    }
  ],
  "suggestedPositioning": "posicionamiento diferenciador recomendado para competir en 2-3 frases",
  "keyDifferentiators": ["diferenciador 1", "diferenciador 2", "diferenciador 3", "diferenciador 4"]
}

Analiza solo los competidores proporcionados. Responde en español.`
    )

    res.json({ success: true, data })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('mapCompetition:', msg)
    res.status(500).json({ success: false, error: msg })
  }
}

// ─── Framework 3: Plan de Distribución 30 días ────────────────────────────────
export async function planDistribution(req: Request, res: Response): Promise<void> {
  try {
    const { product, audience, budget } = req.body as {
      product: string; audience: string; budget: string
    }
    if (!product?.trim() || !audience?.trim() || !budget?.trim()) {
      res.status(400).json({ success: false, error: 'Producto, público y presupuesto son obligatorios.' })
      return
    }

    const data = await claudeJSON(
      'Eres un experto en marketing digital y distribución multicanal. Responde ÚNICAMENTE con JSON válido, sin markdown.',
      `Crea un plan de distribución de 30 días para:
- Producto: ${product}
- Público objetivo: ${audience}
- Presupuesto mensual: ${budget}

Devuelve EXACTAMENTE este JSON:
{
  "channels": [
    {
      "name": "nombre del canal",
      "roi": "alto|medio|bajo",
      "budget": "€X o % del presupuesto",
      "strategy": "estrategia específica en 2 frases",
      "priority": 1
    }
  ],
  "calendar": [
    {
      "week": 1,
      "focus": "enfoque de la semana",
      "actions": [
        { "channel": "nombre canal", "action": "acción concreta", "goal": "objetivo medible" }
      ]
    }
  ]
}

Incluye 6 canales ordenados por ROI (priority 1 = mayor ROI) y exactamente 4 semanas en el calendario con 3 acciones por semana. Responde en español.`
    )

    res.json({ success: true, data })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('planDistribution:', msg)
    res.status(500).json({ success: false, error: msg })
  }
}

// ─── Framework 4: Motor de Contenido Viral ────────────────────────────────────
export async function viralContent(req: Request, res: Response): Promise<void> {
  try {
    const { niche, tone, platforms } = req.body as {
      niche: string; tone: string; platforms: string[]
    }
    if (!niche?.trim() || !tone?.trim() || !platforms?.length) {
      res.status(400).json({ success: false, error: 'Nicho, tono y plataformas son obligatorios.' })
      return
    }

    const data = await claudeJSON(
      'Eres un experto en contenido viral y growth hacking para redes sociales. Responde ÚNICAMENTE con JSON válido, sin markdown.',
      `Crea una estrategia de contenido viral para:
- Nicho: ${niche}
- Tono: ${tone}
- Plataformas: ${platforms.join(', ')}

Devuelve EXACTAMENTE este JSON:
{
  "hooks": [
    { "type": "curiosidad|dolor|urgencia|transformación|controversia|humor", "text": "texto del hook listo para usar", "why": "por qué funciona psicológicamente en 1 frase" }
  ],
  "formatMatrix": [
    { "platform": "nombre plataforma", "format": "formato de contenido", "frequency": "X veces/semana", "goal": "objetivo del formato" }
  ],
  "weeklyCalendar": [
    { "day": "Lunes", "platform": "plataforma", "format": "formato", "topic": "tema concreto para publicar" }
  ]
}

Genera exactamente 10 hooks y 7 entradas en weeklyCalendar (una por día de la semana). Responde en español.`
    )

    res.json({ success: true, data })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('viralContent:', msg)
    res.status(500).json({ success: false, error: msg })
  }
}

// ─── Framework 5: Roadmap de Escalado ─────────────────────────────────────────
export async function scalingRoadmap(req: Request, res: Response): Promise<void> {
  try {
    const { currentRevenue, target, timeframe } = req.body as {
      currentRevenue: string; target: string; timeframe: string
    }
    if (!currentRevenue?.trim() || !target?.trim() || !timeframe?.trim()) {
      res.status(400).json({ success: false, error: 'Ingresos actuales, objetivo y tiempo son obligatorios.' })
      return
    }

    const data = await claudeJSON(
      'Eres un experto en escalado de negocios digitales y agencias de marketing. Responde ÚNICAMENTE con JSON válido, sin markdown.',
      `Crea un roadmap de escalado para:
- Ingresos actuales: ${currentRevenue}
- Objetivo de ingresos: ${target}
- Tiempo disponible: ${timeframe}

Devuelve EXACTAMENTE este JSON:
{
  "phases": [
    {
      "name": "Estabilizar|Automatizar|Delegar|Escalar",
      "duration": "duración estimada",
      "goal": "objetivo principal de la fase en 1 frase",
      "actions": ["acción 1", "acción 2", "acción 3", "acción 4", "acción 5"],
      "kpis": ["kpi 1", "kpi 2", "kpi 3"],
      "milestone": "hito clave que marca el fin de la fase"
    }
  ],
  "summary": "resumen ejecutivo del plan en 3-4 frases",
  "projectedROI": "ROI o crecimiento proyectado al finalizar el roadmap"
}

Genera exactamente 4 fases en el orden: Estabilizar, Automatizar, Delegar, Escalar. Responde en español.`
    )

    res.json({ success: true, data })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('scalingRoadmap:', msg)
    res.status(500).json({ success: false, error: msg })
  }
}
