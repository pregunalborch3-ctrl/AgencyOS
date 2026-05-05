import { Request, Response } from 'express'
import Anthropic from '@anthropic-ai/sdk'

function getClient(): Anthropic {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) throw new Error('ANTHROPIC_API_KEY no está configurada.')
  return new Anthropic({ apiKey: key })
}

// ─── Tool definitions ─────────────────────────────────────────────────────────
const TOOLS: Record<string, {
  system: string
  buildPrompt: (inputs: Record<string, string>) => string
  requiredInputs: string[]
}> = {

  'viral-strategy': {
    requiredInputs: ['niche', 'accountSize', 'audience'],
    system: `Eres un estratega de contenido viral con 10 años de experiencia en Instagram y TikTok.
Creas planes de contenido específicos, accionables y basados en patrones de viralidad probados.
Tus planes incluyen hooks concretos, formatos testados y estructura diaria sin relleno.`,
    buildPrompt: ({ niche, accountSize, audience }) => `
Crea un plan de contenido viral de 30 días para esta cuenta:
- Nicho: ${niche}
- Tamaño actual: ${accountSize} seguidores
- Audiencia objetivo: ${audience}

Estructura tu respuesta así:

## Los 4 pilares de contenido para este nicho
[Un párrafo por pilar: nombre, por qué funciona, ejemplos concretos]

## Estructura semanal (qué publicar cada día)
[Tabla o lista con tipo de contenido por día de la semana y formato recomendado]

## 30 ideas de posts (una por día)
[Para cada una: Día N · Formato · Hook · Objetivo]

## Mejores horarios para esta audiencia
[Horas específicas por día de la semana con justificación]

## Estrategia de hashtags
Grupo nicho (alta especificidad): [10 hashtags]
Grupo categoría (alcance medio): [10 hashtags]
Grupo masivo (>500K): [5 hashtags]
`.trim(),
  },

  'scroll-hook': {
    requiredInputs: ['topic', 'audience', 'tone'],
    system: `Eres un copywriter especialista en hooks virales para redes sociales.
Dominas los patrones psicológicos que detienen el scroll: curiosidad, contraste, provocación, beneficio inmediato.
Cada hook que escribes tiene una razón específica para funcionar y está optimizado para el algoritmo.`,
    buildPrompt: ({ topic, audience, tone }) => `
Escribe 10 ganchos para parar el scroll sobre:
- Tema: ${topic}
- Audiencia: ${audience}
- Tono: ${tone}

Para cada gancho usa este formato exacto:

**Hook N**
[El gancho — máximo 2 líneas, listo para copiar]
→ Trigger: [el mecanismo psicológico que activa: curiosidad / contraste / urgencia / etc.]
→ Mejor para: [Reel / Carrusel / Story / Foto]

Usa una variedad de patrones:
- Afirmación que contradice la creencia común
- Pregunta incómoda que nadie quiere responder
- Dato sorprendente con número concreto
- Contraste antes/después
- Lista con número impar
- Secreto que "no quieren que sepas"
- Error que comete el 90% de [audiencia]
- Promesa de resultado en tiempo récord
- Historia que empieza por el final
- Provocación directa a la audiencia
`.trim(),
  },

  'carousel': {
    requiredInputs: ['topic', 'niche', 'audienceLevel'],
    system: `Eres un experto en carruseles virales de Instagram que generan guardados masivos.
Sabes que los carruseles que se guardan tienen estructura muy específica: hook potente, valor accionable por slide, progresión lógica y CTA irresistible.
Cada slide tiene una sola idea y lleva al siguiente de forma natural.`,
    buildPrompt: ({ topic, niche, audienceLevel }) => `
Crea un carrusel completo de 8 slides sobre:
- Tema: ${topic}
- Nicho: ${niche}
- Nivel de la audiencia: ${audienceLevel}

Para cada slide usa este formato:

---
**SLIDE [N] — [Título del slide]**
Texto: [2-4 líneas directas y escaneables]
Visual: [qué mostrar en el diseño: icono, ilustración, dato destacado, etc.]
---

Estructura obligatoria:
- Slide 1: Hook que promete un resultado claro (haz que quieran pasar al 2)
- Slides 2-7: Un punto de valor por slide (fácil de leer, fácil de recordar)
- Slide 8: CTA que invite a guardar + seguir + comentar

Al final añade:
**Caption de acompañamiento** (3-4 líneas)
**5 hashtags recomendados**
`.trim(),
  },

  'caption': {
    requiredInputs: ['topic', 'objective', 'tone'],
    system: `Eres un copywriter de redes sociales especializado en captions que generan acción real.
Entiendes que cada objetivo (engagement, conversión, crecimiento) requiere estructura y CTA diferentes.
Adaptas el tono, la longitud y el gancho inicial al algoritmo y a la psicología de la audiencia.`,
    buildPrompt: ({ topic, objective, tone }) => `
Escribe los captions para esta publicación:
- Tema: ${topic}
- Objetivo principal: ${objective}
- Tono: ${tone}

---

## CAPTION LARGO
(Para feed, carrusel o cuando quieras maximizar alcance y comentarios)

[Hook de 1-2 líneas que engancha]

[Desarrollo de 4-6 líneas: historia, valor o contexto]

[CTA específico para el objetivo "${objective}"]

Longitud objetivo: 150-220 palabras

---

## CAPTION CORTO
(Para Reels, Stories o posts de impacto rápido)

[Máximo 3 líneas + CTA directo]

---

## HASHTAGS (30)
Nicho (alta especificidad): [10 hashtags]
Categoría (alcance medio): [10 hashtags]
Masivos (>500K): [10 hashtags]
`.trim(),
  },

  'reach-diagnosis': {
    requiredInputs: ['metrics', 'format'],
    system: `Eres un analista experto en el algoritmo de Meta e Instagram con conocimiento profundo de los factores que determinan el alcance orgánico en 2024-2025.
Diagnosticas problemas específicos con la precisión de un médico: primero el síntoma, luego la causa raíz, luego el tratamiento.
Cada recomendación tiene una acción concreta, un plazo y un resultado esperado.`,
    buildPrompt: ({ metrics, format }) => `
Realiza un diagnóstico completo de alcance basado en estos datos reales:

MÉTRICAS:
${metrics}

FORMATO analizado: ${format}

---

## 1. DIAGNÓSTICO GENERAL
[¿Qué está pasando y por qué? Identifica el problema principal en 2-3 frases directas]

## 2. ANÁLISIS POR MÉTRICA
Para cada métrica que aparece en los datos:
- **[Nombre métrica]**: [valor] → [Estado: ✅ / ⚠️ / 🔴] · [Qué indica] · Benchmark: [qué debería ser]

## 3. CAUSA RAÍZ
[Las 2-3 razones principales por las que el alcance está en este nivel]

## 4. PLAN DE ACCIÓN — 2 SEMANAS

**Semana 1 (acciones inmediatas):**
1. [Acción concreta + cómo hacerla + resultado esperado]
2. [Ídem]
3. [Ídem]

**Semana 2 (consolidación):**
1. [Acción + cómo + resultado]
2. [Ídem]
3. [Ídem]

## 5. QUICK WINS
Las 2 cosas que más impacto tendrían en los próximos 7 días y por qué.
`.trim(),
  },
}

// ─── Controller ───────────────────────────────────────────────────────────────
export async function generateContentTool(req: Request, res: Response): Promise<void> {
  try {
    const { tool, inputs } = req.body as { tool: string; inputs: Record<string, string> }

    const toolDef = TOOLS[tool]
    if (!toolDef) {
      res.status(400).json({ success: false, error: `Herramienta desconocida: ${tool}` })
      return
    }

    const missing = toolDef.requiredInputs.filter(k => !inputs?.[k]?.trim())
    if (missing.length > 0) {
      res.status(400).json({ success: false, error: 'Rellena todos los campos antes de generar.' })
      return
    }

    const client = getClient()
    const msg = await client.messages.create({
      model:      'claude-sonnet-4-6',
      max_tokens: 2500,
      system:     toolDef.system,
      messages:   [{ role: 'user', content: toolDef.buildPrompt(inputs) }],
    })

    const result = (msg.content[0] as { text: string }).text.trim()
    res.json({ success: true, data: { result } })
  } catch (err) {
    console.error('[contentTools] Error:', err)
    const msg = err instanceof Error ? err.message : 'Error al generar el contenido.'
    res.status(500).json({ success: false, error: msg })
  }
}
