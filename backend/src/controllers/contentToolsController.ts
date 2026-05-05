import { Request, Response } from 'express'
import Anthropic from '@anthropic-ai/sdk'
import multer from 'multer'
import * as XLSX from 'xlsx'

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    const ext = file.originalname.toLowerCase()
    if (ext.endsWith('.csv') || ext.endsWith('.xlsx') || ext.endsWith('.xls')) cb(null, true)
    else cb(new Error('Solo se admiten CSV o Excel (.xlsx/.xls)'))
  },
})

export async function parseReachFile(req: Request, res: Response): Promise<void> {
  const file = req.file
  if (!file) { res.status(400).json({ success: false, error: 'Archivo requerido' }); return }
  try {
    const name = file.originalname.toLowerCase()
    const wb   = name.endsWith('.csv')
      ? XLSX.read(file.buffer.toString('utf8'), { type: 'string' })
      : XLSX.read(file.buffer, { type: 'buffer' })
    const sheet = wb.Sheets[wb.SheetNames[0]]
    const rows  = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: '' })
    if (rows.length === 0) { res.status(400).json({ success: false, error: 'El archivo no contiene datos.' }); return }
    const cols = Object.keys(rows[0])
    const text = [cols.join('\t'), ...rows.slice(0, 60).map(r => cols.map(c => String(r[c] ?? '')).join('\t'))].join('\n')
    res.json({ success: true, data: { text, rowCount: rows.length, columns: cols.slice(0, 8) } })
  } catch (err) {
    console.error('[parseReachFile]', err)
    res.status(500).json({ success: false, error: 'Error al leer el archivo.' })
  }
}

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
    requiredInputs: ['metrics'],
    system: `Eres un auditor forense de paid media especializado en Meta Ads y TikTok Ads para el mercado europeo (España/EU, 2024-2025).

REGLAS DE DIAGNÓSTICO:
- Analizas ÚNICAMENTE los datos del archivo. NUNCA reformulas ni repites lo que el anunciante ya ve en su panel.
- Identificas patrones no obvios: correlaciones entre métricas, degradaciones temporales, anomalías de distribución de presupuesto.
- Cada hallazgo va respaldado por la cifra exacta del archivo y su distancia al benchmark de referencia.
- Si los datos son insuficientes para un diagnóstico real, lo declaras explícitamente. NUNCA generas recomendaciones sin base directa en los datos.

BENCHMARKS EUROPEOS (España/EU 2024-2025):
CPM: Feed €8-18 (>€25 crítico) | Stories €5-12 | Reels €6-15 | TikTok In-Feed €4-10
CTR: Feed >1.5% bueno / <0.7% problema | Reels >1.0% | TikTok >0.8%
CPC: <€0.50 excelente | €0.50-1.20 aceptable | >€1.50 ineficiente | >€2.50 crítico
Frecuencia: Awareness 1.5-2.5 | Consideración 2-4 | Conversión 3-6 | >6 = saturación confirmada
Quality Ranking Meta: Top 35% = sobre la media | Bottom 35% = fatiga creativa activa
Hook Rate TikTok (retención 3s): >30% bueno | 15-30% mejorable | <15% fatiga severa
Coste por Lead (ecommerce EU): <€5 excelente | €5-15 aceptable | >€25 ineficiente

SEÑALES QUE DETECTAS ACTIVAMENTE:
- Saturación de audiencia: CPM >+30% sin cambio de presupuesto + alcance único estancado
- Fatiga creativa: CTR cayendo >20% semana a semana con CPM estable o creciente
- Penalización por Quality Ranking bajo: costes inflados artificialmente por el algoritmo
- Desajuste objetivo-puja: coste por resultado >2x benchmark del sector
- Concentración presupuestaria ineficiente: un elemento absorbe >60% del presupuesto sin ser el mejor performer`,

    buildPrompt: ({ metrics }) => `
Auditoría forense de campaña de pago con datos reales exportados.

DATOS EXPORTADOS:
${metrics}

━━━ AUDITORÍA ━━━

## DIAGNÓSTICO DE MÉTRICAS CLAVE

Para cada métrica problemática o destacable presente en los datos:
**[Métrica]** → [valor real] | Benchmark EU: [referencia] | Desviación: [+/- %] | Estado: ✅ / ⚠️ / 🔴

REGLA ESTRICTA: No describas lo que el anunciante ya ve. Evalúa si es bueno o malo y cuánto se aleja del benchmark. Las métricas dentro del rango aceptable no las menciones.

---

## PATRONES NO OBVIOS DETECTADOS

Identifica correlaciones y anomalías que NO son evidentes mirando columnas por separado. Ejemplos de patrones a buscar:
- CTR bueno + CPC alto → problema en landing, no en el anuncio
- Frecuencia alta + CTR manteniéndose → audiencia en consideración, no saturada aún
- CPM creciendo + alcance único estancado → saturación confirmada aunque el CTR sea aceptable
- Presupuesto concentrado en elemento con resultados mediocres → ineficiencia estructural
- Quality Ranking bajo + presupuesto alto → el algoritmo penaliza y sube costes artificialmente

Cita exactamente qué datos del archivo llevan a cada conclusión. Si no hay patrones no obvios en los datos disponibles, indícalo.

---

## CAUSA RAÍZ PRINCIPAL

El problema #1 que está drenando el presupuesto ahora mismo. Una sola causa raíz, argumentada con las cifras exactas del archivo. Si los datos no permiten identificarlo con confianza, decláralo: "Los datos disponibles no permiten identificar una causa raíz con certeza — se necesita [dato concreto]."

---

## 3 ACCIONES PRIORITARIAS

Exactamente 3 acciones. Ni una más. Ordenadas de mayor a menor impacto potencial.

**ACCIÓN #1 — [Nombre imperativo y concreto]** · Impacto estimado: +X% en [métrica específica]
→ Qué hacer exactamente (paso a paso si aplica)
→ Por qué: [dato del archivo que lo justifica] vs [benchmark que lo respalda]
→ Medir efecto en: [N días]

**ACCIÓN #2 — [Nombre imperativo y concreto]** · Impacto estimado: +X% en [métrica específica]
→ Qué hacer exactamente
→ Por qué: [dato] vs [benchmark]
→ Medir efecto en: [N días]

**ACCIÓN #3 — [Nombre imperativo y concreto]** · Impacto estimado: +X% en [métrica específica]
→ Qué hacer exactamente
→ Por qué: [dato] vs [benchmark]
→ Medir efecto en: [N días]

---

## ADVERTENCIA DE DATOS (solo si aplica)

Si los datos exportados no incluyen métricas suficientes para diagnóstico fiable (menos de 5 filas, ausencia de frecuencia/coste/CTR, o datos sin contexto de objetivo de campaña), declara aquí qué información adicional es necesaria y por qué sin ella el diagnóstico sería especulativo.
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
