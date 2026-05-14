import { Request, Response } from 'express'
import multer from 'multer'
import * as XLSX from 'xlsx'
import Anthropic from '@anthropic-ai/sdk'

function getClient(): Anthropic {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) throw new Error('ANTHROPIC_API_KEY no está configurada.')
  return new Anthropic({ apiKey: key })
}

const EUR_INSTRUCTION = 'Usa siempre el símbolo € (euros) para todas las cifras monetarias. Nunca uses $ ni ninguna otra divisa.'

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter(_req, file, cb) {
    const allowed = [
      'text/csv', 'application/csv', 'text/plain',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ]
    const ext = file.originalname.toLowerCase()
    if (allowed.includes(file.mimetype) || ext.endsWith('.csv') || ext.endsWith('.xlsx') || ext.endsWith('.xls')) {
      cb(null, true)
    } else {
      cb(new Error('Solo se admiten archivos CSV o Excel (.xlsx/.xls)'))
    }
  },
})

// ─── Columns to keep from Meta Ads exports ───────────────────────────────────
// Meta Ads CSVs have 30-50 columns; most are useless for analysis.
// Keeping only the analytically relevant ones shrinks the payload ~70%.
const META_RELEVANT_COLS = new Set([
  // identity
  'nombre del conjunto de anuncios', 'nombre de la campaña', 'nombre del anuncio',
  'ad set name', 'campaign name', 'ad name',
  // delivery
  'estado del conjunto de anuncios', 'estado de la campaña', 'estado del anuncio',
  'delivery', 'estado', 'status',
  // reach / impressions
  'alcance', 'impresiones', 'reach', 'impressions', 'frecuencia', 'frequency',
  // clicks
  'clics en el enlace', 'clics', 'clicks', 'link clicks', 'ctr (todos)', 'ctr',
  'ctr (tasa de clics del enlace)', 'ctr (link click-through rate)',
  // cost
  'importe gastado (eur)', 'importe gastado', 'amount spent (eur)', 'amount spent',
  'coste por resultado', 'cost per result', 'cpm (coste por 1.000 impresiones)',
  'cpm (cost per 1,000 impressions)', 'cpc (coste por clic en el enlace)',
  'cpc (cost per link click)', 'cpc (all)',
  // results
  'resultados', 'results', 'tipo de resultado', 'result type',
  // conversions / roas
  'roas de compras en el sitio web', 'purchase roas', 'roas',
  'compras en el sitio web', 'website purchases', 'compras', 'purchases',
  'valor de conversión de compras en el sitio web', 'website purchase roas',
  // video
  'reproducciones de video al 25%', 'reproducciones de video al 75%',
  'video plays at 25%', 'video plays at 75%', 'thruplay',
])

function filterCols(header: string[], rows: string[][]): { header: string[]; rows: string[][] } {
  // Keep column if its normalized name is in the relevant set, or if no column
  // matched the relevant set at all (fallback: keep everything)
  const norm = (s: string) => s.toLowerCase().trim()
  const keep = header.map(h => META_RELEVANT_COLS.has(norm(h)))
  const anyMatch = keep.some(Boolean)
  if (!anyMatch) return { header, rows } // unknown export format → keep all
  const idx = keep.map((v, i) => v ? i : -1).filter(i => i !== -1)
  return {
    header: idx.map(i => header[i]),
    rows:   rows.map(r => idx.map(i => r[i] ?? '')),
  }
}

// ─── File → plain text for Claude ────────────────────────────────────────────
// CSV: read the raw UTF-8 bytes directly — no intermediate parsing.
//   XLSX.parse would mangle cell values that contain embedded newlines or
//   special characters before we even reach Claude, producing corrupt JSON.
// Excel: still needs XLSX to convert binary → TSV text.
// Returns the plain-text table (max ~50 rows, relevant cols only) + row count.
function fileToPlainText(
  buffer: Buffer,
  mimetype: string,
  originalname: string,
): { text: string; rowCount: number } {
  const name    = originalname.toLowerCase()
  const isExcel = name.endsWith('.xlsx') || name.endsWith('.xls')
    || mimetype.includes('spreadsheet') || mimetype.includes('excel')

  if (isExcel) {
    const wb   = XLSX.read(buffer, { type: 'buffer' })
    const ws   = wb.Sheets[wb.SheetNames[0]]
    const allRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' })
    if (allRows.length === 0) return { text: '', rowCount: 0 }
    const cols   = Object.keys(allRows[0])
    const data   = allRows.slice(0, 50).map(r => cols.map(c => String((r as Record<string, unknown>)[c] ?? '')))
    const { header, rows } = filterCols(cols, data)
    const text = [header.join('\t'), ...rows.map(r => r.join('\t'))].join('\n')
    return { text, rowCount: allRows.length }
  }

  // ── CSV: send raw text as-is — no parsing, no splitting, no corruption ──
  // Naive comma-split breaks quoted fields ("value, with, commas").
  // Claude understands CSV natively; just strip BOM and cap at 50 data rows.
  const raw      = buffer.toString('utf-8').replace(/^﻿/, '')
  const lines    = raw.split(/\r?\n/).filter(l => l.trim() !== '')
  if (lines.length < 2) return { text: lines.join('\n'), rowCount: 0 }

  const totalDataRows = lines.length - 1
  const capped        = lines.slice(0, 51) // header + 50 rows
  return { text: capped.join('\n'), rowCount: totalDataRows }
}

// ─── Robust JSON repair ───────────────────────────────────────────────────────
// Fixes two classes of malformed JSON that Claude occasionally produces:
//  1. Unescaped control chars inside strings (newlines, tabs, etc.)
//  2. Invalid JSON escape sequences (\-, \s, \d …) → escaped to \\x
const VALID_JSON_ESCAPES = new Set(['"', '\\', '/', 'b', 'f', 'n', 'r', 't', 'u'])

function repairJson(s: string): string {
  let out = ''
  let inString = false
  let i = 0
  while (i < s.length) {
    const ch   = s[i]
    const code = s.charCodeAt(i)
    if (inString) {
      if (ch === '\\') {
        const next = s[i + 1] ?? ''
        if (next === 'u') {
          // unicode escape: pass through \uXXXX
          out += s.slice(i, i + 6)
          i += 6
        } else if (VALID_JSON_ESCAPES.has(next)) {
          // valid escape: pass through as-is
          out += ch + next
          i += 2
        } else {
          // invalid escape (e.g. \-, \s, \d) → escape the backslash
          out += '\\\\' + next
          i += 2
        }
        continue
      }
      if (ch === '"') {
        inString = false
        out += ch
      } else if (code < 0x20) {
        // unescaped control char inside string → escape it
        if      (code === 0x0a) out += '\\n'
        else if (code === 0x0d) out += '\\r'
        else if (code === 0x09) out += '\\t'
        // drop other control chars (0x00-0x08, 0x0b, 0x0c, 0x0e-0x1f)
      } else {
        out += ch
      }
    } else {
      if (ch === '"') inString = true
      out += ch
    }
    i++
  }
  return out
}

// ─── Analysis result type ─────────────────────────────────────────────────────
interface AnalysisResult {
  summary: string
  performingWell: Array<{ name: string; reason: string; highlight: string }>
  performingPoorly: Array<{ name: string; reason: string; action: string }>
  belowAverage: Array<{ metric: string; value: string; benchmark: string; fix: string }>
  recommendations: Array<{ priority: 'alta' | 'media' | 'baja'; title: string; description: string }>
  executiveSummary: string
}

// ─── Controller ───────────────────────────────────────────────────────────────
export async function analyzeMetaAds(req: Request, res: Response): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, error: 'No se recibió ningún archivo.' })
      return
    }

    let plainText: string
    let rowCount: number
    try {
      const parsed = fileToPlainText(req.file.buffer, req.file.mimetype, req.file.originalname)
      plainText = parsed.text
      rowCount  = parsed.rowCount
    } catch {
      res.status(400).json({ success: false, error: 'No se pudo leer el archivo. Asegúrate de que es un CSV o Excel válido de Meta Ads.' })
      return
    }

    if (!plainText || rowCount === 0) {
      res.status(400).json({ success: false, error: 'El archivo está vacío o no tiene datos válidos.' })
      return
    }

    const textBytes = Buffer.byteLength(plainText, 'utf-8')
    console.log(`[metaAnalysis] rows=${rowCount} textBytes=${textBytes} cols=${plainText.split('\n')[0]?.split('\t').length ?? '?'}`)
    console.log('[metaAnalysis] header:', plainText.split('\n')[0]?.slice(0, 200))

    // ── 55-second timeout — Railway proxy cuts at ~60s ────────────────────
    const abort  = new AbortController()
    const timer  = setTimeout(() => {
      abort.abort()
      console.error('[metaAnalysis] TIMEOUT — Claude did not respond in 55s')
    }, 55_000)

    const client = getClient()
    console.log('[metaAnalysis] calling Claude…')
    let msg: Awaited<ReturnType<typeof client.messages.create>>
    try {
      msg = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
      system: `Eres un auditor forense de paid media con 10+ años auditando cuentas de Meta Ads. \
Tu metodología evalúa cada euro gastado con la precisión de un auditor financiero: ningún dato sin contrastar, ninguna ineficiencia sin cuantificar, ninguna recomendación sin impacto de negocio estimado. \
Diagnosticas fatiga creativa, saturación de audiencia, eficiencia de coste por placement y salud estructural de la cuenta. \
Responde SOLO con JSON válido. Sin markdown, sin bloques de código, sin texto fuera del JSON. \
IMPORTANTE: Todos los valores de string en el JSON deben estar en una sola línea. Nunca uses saltos de línea, tabuladores ni barras invertidas dentro de los valores. Usa solo caracteres ASCII seguros.

${EUR_INSTRUCTION}`,
      messages: [{
        role: 'user',
        content: `Realiza una auditoría experta de estos datos reales de Meta Ads Manager. \
Cada hallazgo debe citar valores exactos de la tabla. No inventes ni estimes datos.

DATOS (${rowCount} filas):
${plainText}

━━━ FRAMEWORK DE AUDITORÍA ━━━

1. FATIGA CREATIVA Y SATURACIÓN DE AUDIENCIA
   Señales de fatiga: Frecuencia >3 = alerta, >5 = crítico (pausa inmediata)
   Saturación: Alcance estancado + Frecuencia subiendo = audiencia agotada
   CTR decreciente con CPM creciente = señal temprana de fatiga

2. EFICIENCIA DE COSTE POR PLACEMENT (benchmarks reales España/Europa)
   CPM:  Feed Noticias €8-18 (>€25 crítico) | Stories €5-12 | Reels €6-15 | Audience Network €2-6
   CTR:  Feed >1.5% bueno, <0.7% pobre | Stories >0.8% bueno | Reels >1.0% bueno
   CPC:  <€0.50 excelente | €0.50-1.20 aceptable | >€1.50 ineficiente | >€2.50 crítico
   ROAS: >5x excelente | 3.5-5x bueno | 2-3.5x mínimo aceptable | <2x ineficiente
   Frecuencia óptima por objetivo: Awareness 1.5-2.5 | Consideración 2-4 | Conversión 3-6

3. DIAGNÓSTICO ESTRUCTURAL
   Evalúa: Coste por resultado vs objetivo de campaña | Distribución de presupuesto entre elementos
   Identifica: Ganadores claros (escalar) | Perdedores confirmados (pausar) | Oportunidades sin explotar

4. IMPACTO DE NEGOCIO
   Cada hallazgo crítico debe incluir el impacto estimado si se actúa vs si se ignora.
   Prioriza por: (severidad × presupuesto afectado) — los problemas que queman más dinero van primero.

━━━ FORMATO DE RESPUESTA ━━━

Devuelve ÚNICAMENTE este JSON con los valores exactos de la tabla:
{
  "summary": "3-4 frases de diagnóstico directo: estado real de la cuenta, eficiencia global del gasto, y el hallazgo más crítico con su cifra exacta",
  "performingWell": [
    {
      "name": "nombre exacto del elemento en la tabla",
      "reason": "por qué supera benchmarks: métrica concreta vs referencia del sector",
      "highlight": "la cifra clave que lo demuestra (ej: CTR 2.8% — 87% sobre benchmark feed)"
    }
  ],
  "performingPoorly": [
    {
      "name": "nombre exacto del elemento en la tabla",
      "reason": "diagnóstico preciso con valor exacto y qué lo causa (fatiga, saturación, segmentación, etc.)",
      "action": "acción inmediata específica: qué pausar, qué ajustar, con qué sustituirlo y en qué plazo"
    }
  ],
  "belowAverage": [
    {
      "metric": "nombre de la columna exacta",
      "value": "valor promedio calculado de los datos reales",
      "benchmark": "referencia del sector para este placement/objetivo",
      "fix": "acción correctora concreta con impacto estimado (ej: reducir CPM un 20% segmentando por intereses)"
    }
  ],
  "recommendations": [
    {
      "priority": "alta",
      "title": "acción concreta con verbo imperativo",
      "description": "qué hacer exactamente, por qué ahora, qué impacto tiene en gasto/resultado, con datos reales de la tabla"
    },
    { "priority": "media", "title": "...", "description": "..." },
    { "priority": "baja",  "title": "...", "description": "..." }
  ],
  "executiveSummary": "5-6 frases para presentar al cliente: rendimiento actual en cifras reales, qué está funcionando y por qué, qué está fallando y el coste de no actuar, próximos 3 pasos priorizados. Sin jerga técnica."
}

${EUR_INSTRUCTION}`,
        }],
      }, { signal: abort.signal as AbortSignal })
    } catch (aiErr: unknown) {
      clearTimeout(timer)
      const isTimeout = aiErr instanceof Error && (aiErr.name === 'AbortError' || aiErr.message.includes('abort'))
      console.error('[metaAnalysis] Claude error:', aiErr instanceof Error ? aiErr.message : aiErr)
      res.status(503).json({
        success: false,
        error: isTimeout
          ? 'El análisis tardó demasiado. Intenta con un CSV más pequeño (menos filas o columnas).'
          : 'Error al llamar a la IA. Inténtalo de nuevo.',
      })
      return
    }
    clearTimeout(timer)
    const stopReason    = msg.stop_reason
    const outputTokens  = msg.usage?.output_tokens ?? 0
    console.log(`[metaAnalysis] Claude responded — stopReason=${stopReason} outputTokens=${outputTokens}`)

    // Truncated response = hit max_tokens limit → JSON is incomplete
    if (stopReason === 'max_tokens') {
      console.error('[metaAnalysis] Response truncated at max_tokens limit')
      res.status(500).json({ success: false, error: 'La respuesta de la IA fue demasiado larga. Intenta con un CSV más pequeño.' })
      return
    }

    const raw   = (msg.content[0] as { text: string }).text.trim()
    const first = raw.indexOf('{')
    const last  = raw.lastIndexOf('}')
    if (first === -1 || last === -1) {
      console.error('[metaAnalysis] No JSON found in response:', raw.slice(0, 300))
      res.status(500).json({ success: false, error: 'La IA devolvió una respuesta inesperada. Inténtalo de nuevo.' })
      return
    }

    const jsonSlice = raw.slice(first, last + 1)
    let analysis: AnalysisResult
    try {
      analysis = JSON.parse(jsonSlice) as AnalysisResult
    } catch (e1) {
      console.warn('[metaAnalysis] JSON.parse failed:', (e1 as Error).message)
      console.warn('[metaAnalysis] raw response (first 1000):', raw.slice(0, 1000))
      try {
        analysis = JSON.parse(repairJson(jsonSlice)) as AnalysisResult
      } catch (e2) {
        console.error('[metaAnalysis] repairJson also failed:', (e2 as Error).message)
        console.error('[metaAnalysis] full raw response:', raw)
        res.status(500).json({ success: false, error: 'La IA devolvió un formato inesperado. Inténtalo de nuevo.' })
        return
      }
    }
    console.log('[metaAnalysis] analysis parsed OK')
    res.json({ success: true, data: { analysis, rowCount } })
  } catch (err) {
    console.error('[metaAnalysis] Error:', err)
    const msg = err instanceof Error ? err.message : 'Error al analizar las campañas.'
    res.status(500).json({ success: false, error: msg })
  }
}
