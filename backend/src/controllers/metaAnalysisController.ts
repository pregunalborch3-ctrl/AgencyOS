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
    const data   = allRows.slice(0, 100).map(r => cols.map(c => String((r as Record<string, unknown>)[c] ?? '')))
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
  const capped        = lines.slice(0, 101) // header + 100 rows
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
    console.log(`[metaAnalysis] rows=${rowCount} textBytes=${textBytes}`)

    // ── SSE streaming — keeps Railway/Vercel connection alive ────────────────
    // Instead of waiting for the full response (which hits the 60s proxy
    // timeout), we stream SSE heartbeats every 15s while Claude thinks,
    // then send the final JSON as the last event.
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
    res.setHeader('Cache-Control', 'no-cache, no-transform')
    res.setHeader('X-Accel-Buffering', 'no') // disable nginx buffering
    res.flushHeaders()

    const heartbeat = setInterval(() => {
      res.write(': heartbeat\n\n')
    }, 15_000)

    function sendEvent(payload: object) {
      clearInterval(heartbeat)
      res.write(`data: ${JSON.stringify(payload)}\n\n`)
      res.end()
    }

    const client = getClient()
    console.log('[metaAnalysis] streaming Claude…')

    let fullText = ''
    try {
      const stream = client.messages.stream({
        model: 'claude-sonnet-4-6',
        max_tokens: 16000,
        system: `Eres el director de paid media de una agencia de performance con 15+ años auditando cuentas de Meta Ads para clientes de e-commerce, retail y servicios en España y Latinoamérica. \
Tu auditoría es el estándar de la industria: cada euro analizado, cada ineficiencia cuantificada, cada oportunidad priorizada por impacto en negocio. \
Diagnosticas fatiga creativa, saturación de audiencia, overlap de públicos, eficiencia por placement y salud estructural de la cuenta. \
Cuando el CSV contiene muchas campañas, analiza TODAS y agrupa las conclusiones. Sé exhaustivo: el cliente paga por una auditoría completa, no por un resumen superficial. \
Responde SOLO con JSON válido. Sin markdown, sin bloques de código, sin texto fuera del JSON. \
IMPORTANTE: Todos los valores de string deben estar en una sola línea. Nunca uses saltos de línea reales dentro de los valores. Usa solo caracteres ASCII seguros.

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
   CTR decreciente con CPM creciente = señal temprana de fatiga

2. EFICIENCIA DE COSTE (benchmarks España/Europa)
   CPM: Feed €8-18 | Stories €5-12 | Reels €6-15
   CTR: Feed >1.5% bueno, <0.7% pobre | CPC: <€0.50 excelente, >€1.50 ineficiente
   ROAS: >5x excelente | 3.5-5x bueno | <2x ineficiente

3. DIAGNÓSTICO ESTRUCTURAL
   Ganadores (escalar), Perdedores (pausar), Oportunidades sin explotar

━━━ FORMATO DE RESPUESTA ━━━

Devuelve ÚNICAMENTE este JSON (sin markdown, sin bloques de código).
Incluye TODOS los anuncios/conjuntos relevantes — no te limites a 3 o 4. Cuantos más datos tenga el CSV, más completo debe ser el análisis.
{
  "summary": "3-4 frases: estado global de la cuenta, eficiencia del gasto total, hallazgo más crítico con cifra exacta, potencial de mejora estimado",
  "performingWell": [{"name":"nombre exacto del anuncio/conjunto","reason":"explicación detallada de por qué supera benchmarks con cifras concretas","highlight":"métrica clave con valor exacto"}],
  "performingPoorly": [{"name":"nombre exacto","reason":"diagnóstico detallado con valor exacto y comparativa con benchmark","action":"acción concreta e inmediata con impacto esperado"}],
  "belowAverage": [{"metric":"nombre exacto de la columna","value":"valor promedio real de la cuenta","benchmark":"referencia del sector para España/Europa","fix":"acción correctora específica con impacto esperado"}],
  "recommendations": [
    {"priority":"alta","title":"título imperativo y específico","description":"qué hacer exactamente, por qué es urgente, impacto estimado en ROAS/CPA/gasto"},
    {"priority":"alta","title":"...","description":"..."},
    {"priority":"media","title":"...","description":"..."},
    {"priority":"media","title":"...","description":"..."},
    {"priority":"baja","title":"...","description":"..."}
  ],
  "executiveSummary": "5-6 frases profesionales para presentar al cliente: inversión total analizada, rendimiento global vs benchmarks, 2-3 hallazgos clave con cifras, próximos 3 pasos priorizados"
}

${EUR_INSTRUCTION}`,
        }],
      })

      for await (const event of stream) {
        if (
          event.type === 'content_block_delta' &&
          event.delta.type === 'text_delta'
        ) {
          fullText += event.delta.text
        }
      }

      const finalMsg = await stream.finalMessage()
      const stopReason   = finalMsg.stop_reason
      const outputTokens = finalMsg.usage?.output_tokens ?? 0
      console.log(`[metaAnalysis] done — stopReason=${stopReason} outputTokens=${outputTokens}`)

      if (stopReason === 'max_tokens') {
        sendEvent({ success: false, error: 'La respuesta fue demasiado larga. Intenta con un CSV más pequeño.' })
        return
      }

      const first = fullText.indexOf('{')
      const last  = fullText.lastIndexOf('}')
      if (first === -1 || last === -1) {
        console.error('[metaAnalysis] No JSON in response:', fullText.slice(0, 300))
        sendEvent({ success: false, error: 'La IA devolvió una respuesta inesperada. Inténtalo de nuevo.' })
        return
      }

      const jsonSlice = fullText.slice(first, last + 1)
      let analysis: AnalysisResult
      try {
        analysis = JSON.parse(jsonSlice) as AnalysisResult
      } catch (e1) {
        console.warn('[metaAnalysis] JSON.parse failed, trying repair:', (e1 as Error).message)
        console.warn('[metaAnalysis] raw (first 800):', fullText.slice(0, 800))
        try {
          analysis = JSON.parse(repairJson(jsonSlice)) as AnalysisResult
        } catch (e2) {
          console.error('[metaAnalysis] repair failed:', (e2 as Error).message)
          console.error('[metaAnalysis] full raw:', fullText)
          sendEvent({ success: false, error: 'La IA devolvió un formato inesperado. Inténtalo de nuevo.' })
          return
        }
      }
      console.log('[metaAnalysis] parsed OK')
      sendEvent({ success: true, data: { analysis, rowCount } })
    } catch (err) {
      console.error('[metaAnalysis] stream error:', err instanceof Error ? err.message : err)
      sendEvent({ success: false, error: 'Error al llamar a la IA. Inténtalo de nuevo.' })
    }
  } catch (err) {
    console.error('[metaAnalysis] Error:', err)
    const msg = err instanceof Error ? err.message : 'Error al analizar las campañas.'
    res.status(500).json({ success: false, error: msg })
  }
}
