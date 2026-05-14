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

// ─── File → plain text for Claude ────────────────────────────────────────────
// CSV: read the raw UTF-8 bytes directly — no intermediate parsing.
//   XLSX.parse would mangle cell values that contain embedded newlines or
//   special characters before we even reach Claude, producing corrupt JSON.
// Excel: still needs XLSX to convert binary → TSV text.
// Returns the plain-text table and an approximate row count.
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
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' })
    if (rows.length === 0) return { text: '', rowCount: 0 }
    const capped = rows.slice(0, 100)
    const cols   = Object.keys(capped[0])
    const text   = [
      cols.join('\t'),
      ...capped.map(row => cols.map(c => String((row as Record<string, unknown>)[c] ?? '')).join('\t')),
    ].join('\n')
    return { text, rowCount: rows.length }
  }

  // ── CSV: raw text, strip UTF-8 BOM if present, cap at 100 data rows ──────
  const raw   = buffer.toString('utf-8').replace(/^﻿/, '')
  const lines = raw.split(/\r?\n/)
  const nonEmpty = lines.filter(l => l.trim() !== '')
  const capped   = nonEmpty.slice(0, 101) // header + up to 100 rows
  return {
    text:     capped.join('\n'),
    rowCount: Math.max(0, capped.length - 1),
  }
}

// ─── Robust JSON repair ───────────────────────────────────────────────────────
// Walks the raw string char-by-char and escapes control characters that are
// invalid inside JSON strings (literal \n, \r, \t, etc.). This fixes the
// "Expected ',' or ']'" errors that occur when Claude includes unescaped
// newlines or other control chars from CSV cell values.
function repairJson(s: string): string {
  let out = ''
  let inString = false
  let i = 0
  while (i < s.length) {
    const ch   = s[i]
    const code = s.charCodeAt(i)
    if (inString) {
      if (ch === '\\') {
        // pass through escape sequence as-is
        out += ch + (s[i + 1] ?? '')
        i += 2
        continue
      }
      if (ch === '"') {
        inString = false
        out += ch
      } else if (code < 0x20) {
        // control char inside string → escape it
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

    console.log('[metaAnalysis] rows received:', rowCount)
    console.log('[metaAnalysis] first 200 chars:', plainText.slice(0, 200))

    const client = getClient()
    const msg = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      system: `Eres un auditor forense de paid media con 10+ años auditando cuentas de Meta Ads. \
Tu metodología evalúa cada euro gastado con la precisión de un auditor financiero: ningún dato sin contrastar, ninguna ineficiencia sin cuantificar, ninguna recomendación sin impacto de negocio estimado. \
Diagnosticas fatiga creativa, saturación de audiencia, eficiencia de coste por placement y salud estructural de la cuenta. \
Responde SOLO con JSON válido. Sin markdown, sin bloques de código, sin texto fuera del JSON.

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
    })

    const raw   = (msg.content[0] as { text: string }).text.trim()
    const first = raw.indexOf('{')
    const last  = raw.lastIndexOf('}')
    if (first === -1 || last === -1) {
      res.status(500).json({ success: false, error: 'La IA devolvió una respuesta inesperada. Inténtalo de nuevo.' })
      return
    }

    const jsonSlice = raw.slice(first, last + 1)
    let analysis: AnalysisResult
    try {
      analysis = JSON.parse(jsonSlice) as AnalysisResult
    } catch {
      // Retry after repairing unescaped control characters in string values
      analysis = JSON.parse(repairJson(jsonSlice)) as AnalysisResult
    }
    res.json({ success: true, data: { analysis, rowCount } })
  } catch (err) {
    console.error('[metaAnalysis] Error:', err)
    const msg = err instanceof Error ? err.message : 'Error al analizar las campañas.'
    res.status(500).json({ success: false, error: msg })
  }
}
