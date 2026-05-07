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

const EUR_INSTRUCTION = 'Usa siempre el símbolo € (euros) para todas las cifras monetarias. Nunca uses $ ni ninguna otra divisa.'

// ─── Tool definitions ─────────────────────────────────────────────────────────
const TOOLS: Record<string, {
  system: string
  buildPrompt: (inputs: Record<string, string>) => string
  requiredInputs: string[]
}> = {

  'proposal': {
    requiredInputs: ['tipoCliente', 'sector', 'presupuesto', 'servicios', 'painPoint'],
    system: `Eres un director de cuentas senior con 10 años cerrando contratos para agencias de marketing digital. Tu especialidad es escribir propuestas comerciales que convierten reuniones en clientes.`,
    buildPrompt: ({ tipoCliente, sector, presupuesto, servicios, painPoint }) => `
El cliente es: ${tipoCliente}
Sector: ${sector}
Presupuesto mensual aproximado: ${presupuesto}
Servicios que necesita: ${servicios}
Pain point principal: ${painPoint}

Escribe una propuesta comercial completa con esta estructura:
1. RESUMEN EJECUTIVO (3-4 líneas que enganchen, enfocadas en resultados, no en servicios)
2. DIAGNÓSTICO (qué está fallando ahora en su marketing, sé específico para su sector)
3. NUESTRA SOLUCIÓN (qué vamos a hacer exactamente, mes a mes)
4. POR QUÉ NOSOTROS (3 razones concretas, sin clichés)
5. INVERSIÓN (desglosa el presupuesto por servicio de forma clara)
6. PRÓXIMOS PASOS (3 pasos simples para arrancar)

Tono: profesional pero cercano, directo, orientado a negocio. Nada de palabrería vacía.
`.trim(),
  },

  'monthly-report': {
    requiredInputs: ['periodo', 'cliente', 'canales', 'metricas', 'objetivo', 'presupuesto'],
    system: `Eres un account manager experto en comunicar resultados de marketing a clientes no técnicos. Tu objetivo es que el cliente entienda exactamente qué pasó, por qué, y qué viene ahora.`,
    buildPrompt: ({ periodo, cliente, canales, metricas, objetivo, presupuesto }) => `
Periodo: ${periodo}
Cliente: ${cliente}
Canales trabajados: ${canales}
Métricas principales: ${metricas}
Objetivo que teníamos: ${objetivo}
Presupuesto invertido: ${presupuesto}

Genera un informe ejecutivo con esta estructura:
## RESUMEN DEL MES (máx 4 líneas)
## QUÉ FUNCIONÓ Y POR QUÉ (2-3 puntos con datos concretos)
## QUÉ MEJORAREMOS (2-3 puntos como oportunidades con acción concreta)
## FOCO DEL PRÓXIMO MES (3 prioridades con objetivo medible)
## CONCLUSIÓN (2 líneas que dejen al cliente con confianza)

Usa lenguaje de negocio, no de marketing. Evita jerga técnica.
`.trim(),
  },

  'difficult-email': {
    requiredInputs: ['cliente', 'situacion', 'tonoRelacion', 'objetivoEmail'],
    system: `Eres un director de cuentas con 10 años gestionando relaciones con clientes complicados. Un email mal escrito puede perder un cliente, uno bien escrito puede salvar la relación.`,
    buildPrompt: ({ cliente, situacion, tonoRelacion, objetivoEmail }) => `
Cliente: ${cliente}
Situación: ${situacion}
Tono de la relación: ${tonoRelacion}
Objetivo del email: ${objetivoEmail}

Escribe el email completo con:
- ASUNTO: directo y no alarmista
- Apertura directa (sin "espero que estés bien")
- Reconocer la situación sin excusas vacías
- Explicación honesta y breve (máx 3 líneas)
- Lo que vamos a hacer exactamente para solucionarlo
- Propuesta concreta de siguiente paso
- Cierre que mantenga la confianza

Tono: profesional, directo, humano. Sin victimismo ni exceso de disculpas.
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

## RESUMEN EJECUTIVO

3-4 líneas directas. Incluye: (1) estado global de la cuenta en cifras concretas del archivo, (2) el problema más crítico con su dato exacto y cuánto se desvía del benchmark, (3) el coste estimado de no actuar. Sin tecnicismos. Pensado para leer en 10 segundos.

---

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
      system:     `${toolDef.system}\n\n${EUR_INSTRUCTION}`,
      messages:   [{ role: 'user', content: `${toolDef.buildPrompt(inputs)}\n\n${EUR_INSTRUCTION}` }],
    })

    const result = (msg.content[0] as { text: string }).text.trim()
    res.json({ success: true, data: { result } })
  } catch (err) {
    console.error('[contentTools] Error:', err)
    const msg = err instanceof Error ? err.message : 'Error al generar el contenido.'
    res.status(500).json({ success: false, error: msg })
  }
}
