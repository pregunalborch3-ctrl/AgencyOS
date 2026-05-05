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
    requiredInputs: ['metrics', 'format'],
    system: `Eres un auditor forense de contenido orgánico especializado en el algoritmo de distribución de Instagram y TikTok (2024-2025).
Tu metodología combina análisis estadístico de señales con patrones algorítmicos documentados:
- Señales de calidad: guardados y compartidos pesan x3 vs likes en el ranking de distribución
- Ratio alcance no-seguidores/total: objetivo >40% Instagram, >60% TikTok
- Ventana crítica de distribución: primeras 2h post-publicación determinan el 80% del alcance final
- Ratio guardados/alcance >3% = el algoritmo cataloga el contenido como "alta calidad" y amplifica
- Frecuencia óptima vs fatiga: publicar más de 2x/día colapsa el alcance individual de cada post
Tu diagnóstico se basa SIEMPRE en los datos reales proporcionados. Citas números exactos del archivo.
Si un dato no está disponible, lo indicas en lugar de inventarlo.`,
    buildPrompt: ({ metrics, format }) => `
Realiza una auditoría forense de alcance orgánico con estos datos exportados:

FORMATO ANALIZADO: ${format}

DATOS REALES EXPORTADOS:
${metrics}

---

## 1. BASELINE — QUÉ TIENES HOY

Evalúa cada métrica presente en los datos:
**[Nombre métrica]** → [valor real del archivo] | Benchmark 2025: [referencia] | Estado: ✅ Bien / ⚠️ Mejorable / 🔴 Problema

Si hay múltiples publicaciones, calcula medias. Cita SOLO datos del archivo, nunca inventados.

## 2. PATRONES DETECTADOS

**Mejor rendimiento:** [qué publicación/tipo tiene mejores números y por qué]
**Peor rendimiento:** [cuál tiene peores números + patrón detectado]
**Ratio guardados/alcance:** [si disponible: >3%=calidad, <1%=problema de valor percibido]
**Distribución a no-seguidores:** [si disponible: indica si el algoritmo está amplificando o no]
**Patrón temporal:** [si hay variación por fecha/día, nómbrala; si no hay datos suficientes, dilo]

## 3. CAUSA RAÍZ (diagnóstico específico)

Las 2-3 razones técnicas principales, en orden de impacto. Para cada una:
- El mecanismo algorítmico exacto
- Qué dato de los tuyos lo confirma
- Qué debería cambiar para solucionarlo

## 4. PROTOCOLO DE 14 DÍAS

**Días 1-3 — Diagnóstico activo:**
→ Día 1: [acción concreta + hora óptima para ${format} + métrica a vigilar en primeras 2h]
→ Día 2: [prueba de la variable más débil detectada en tus datos]
→ Día 3: [análisis: si [métrica X] > [threshold], continuar; si no, ajustar Z]

**Días 4-7 — Ajuste basado en evidencia:**
→ Día 4: [acción basada en datos días 1-3]
→ Día 5: [A/B test específico: qué variable + cómo medir el resultado]
→ Día 6: [optimización de horario o frecuencia según señales acumuladas]
→ Día 7: [revisión semanal: 3 KPIs a comparar vs semana anterior]

**Días 8-14 — Consolidación:**
→ Día 8-10: [escalar lo que funcionó + frecuencia recomendada]
→ Día 11-12: [ajuste fino basado en datos acumulados]
→ Día 13-14: [preparar siguiente ciclo: qué tipos de contenido testear en semanas 3-4]

## 5. QUICK WINS — Próximas 48h

**Acción #1 (mayor impacto, basada en tus datos):**
[Qué hacer exactamente + por qué esta acción tiene el mayor retorno basándose en tus métricas reales + resultado esperado en X días]

**Acción #2:**
[Ídem]
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
