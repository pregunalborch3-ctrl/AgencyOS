import { Request, Response } from 'express'
import multer from 'multer'
import * as XLSX from 'xlsx'
import Anthropic from '@anthropic-ai/sdk'

function getClient(): Anthropic {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) throw new Error('ANTHROPIC_API_KEY no está configurada.')
  return new Anthropic({ apiKey: key })
}

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

// ─── CSV parser ───────────────────────────────────────────────────────────────
function parseCSV(text: string): Array<Record<string, string>> {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim().split('\n')
  if (lines.length < 2) return []

  // Detect delimiter (comma or semicolon)
  const firstLine = lines[0]
  const delimiter = (firstLine.match(/;/g) ?? []).length > (firstLine.match(/,/g) ?? []).length ? ';' : ','

  function parseLine(line: string): string[] {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++ }
        else inQuotes = !inQuotes
      } else if (ch === delimiter && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += ch
      }
    }
    result.push(current.trim())
    return result
  }

  const headers = parseLine(lines[0]).map(h => h.replace(/^"|"$/g, '').trim())
  return lines.slice(1)
    .filter(l => l.trim())
    .map(line => {
      const values = parseLine(line)
      const row: Record<string, string> = {}
      headers.forEach((h, i) => { row[h] = (values[i] ?? '').replace(/^"|"$/g, '').trim() })
      return row
    })
}

// ─── Parse Excel/CSV buffer → rows ───────────────────────────────────────────
function parseFile(buffer: Buffer, mimetype: string, originalname: string): Array<Record<string, string>> {
  const isExcel = originalname.toLowerCase().endsWith('.xlsx') || originalname.toLowerCase().endsWith('.xls')
    || mimetype.includes('spreadsheet') || mimetype.includes('excel')

  if (isExcel) {
    const wb = XLSX.read(buffer, { type: 'buffer' })
    const ws = wb.Sheets[wb.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' })
    return rows.map(row => {
      const out: Record<string, string> = {}
      for (const [k, v] of Object.entries(row)) {
        out[String(k)] = String(v ?? '')
      }
      return out
    })
  }

  return parseCSV(buffer.toString('utf-8'))
}

// ─── Format raw rows as a readable table for Claude ──────────────────────────
// Sends the actual column names and values — no brittle alias mapping needed.
function buildRawTable(rows: Array<Record<string, string>>): string {
  if (rows.length === 0) return ''
  const cols = Object.keys(rows[0])
  const cap  = rows.slice(0, 40) // cap at 40 rows to stay within token budget
  return [
    cols.join('\t'),
    ...cap.map(row => cols.map(c => row[c] ?? '').join('\t')),
  ].join('\n')
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

    let rows: Array<Record<string, string>>
    try {
      rows = parseFile(req.file.buffer, req.file.mimetype, req.file.originalname)
    } catch {
      res.status(400).json({ success: false, error: 'No se pudo leer el archivo. Asegúrate de que es un CSV o Excel válido de Meta Ads.' })
      return
    }

    if (rows.length === 0) {
      res.status(400).json({ success: false, error: 'El archivo está vacío o no tiene datos válidos.' })
      return
    }

    const rawTable   = buildRawTable(rows)
    const columnsList = Object.keys(rows[0]).join(', ')

    console.log('[metaAnalysis] columns:', columnsList)
    console.log('[metaAnalysis] rows received:', rows.length)
    console.log('[metaAnalysis] raw table (first 3 rows):\n', buildRawTable(rows.slice(0, 3)))

    const client = getClient()
    const msg = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      system: 'Eres un experto analista de Meta Ads con 10 años de experiencia. Analizas datos reales de campañas y das recomendaciones accionables. Responde SOLO con JSON válido, sin markdown ni bloques de código.',
      messages: [{
        role: 'user',
        content: `Analiza estos datos reales exportados de Meta Ads Manager. Los datos están en formato tabla (columnas separadas por tabulador). Usa los valores exactos de la tabla — no inventes ni estimes datos.

DATOS REALES (${rows.length} filas):
${rawTable}

BENCHMARKS DE REFERENCIA (ecommerce España):
- CTR: bueno >1.5%, malo <0.5%
- CPC: bueno <€0.70, malo >€1.50
- CPM: bueno <€12, malo >€25
- ROAS: bueno >3.5x, mínimo aceptable 2.0x
- Coste por resultado: evalúa según el objetivo de la campaña

Devuelve ÚNICAMENTE este JSON (en español, con los nombres y valores exactos de la tabla):
{
  "summary": "2-3 frases sobre el estado general usando cifras reales de la tabla",
  "performingWell": [
    { "name": "nombre exacto de la fila", "reason": "por qué destaca con valores concretos de la tabla", "highlight": "la métrica clave con su valor exacto" }
  ],
  "performingPoorly": [
    { "name": "nombre exacto de la fila", "reason": "problema específico con valores concretos", "action": "acción inmediata y concreta" }
  ],
  "belowAverage": [
    { "metric": "nombre de columna", "value": "valor promedio calculado de la tabla", "benchmark": "referencia del sector", "fix": "cómo mejorarlo" }
  ],
  "recommendations": [
    { "priority": "alta", "title": "acción concreta", "description": "qué hacer exactamente y por qué, referenciando datos reales" },
    { "priority": "media", "title": "...", "description": "..." },
    { "priority": "baja",  "title": "...", "description": "..." }
  ],
  "executiveSummary": "4-6 frases para el cliente usando cifras reales, sin jerga técnica, con próximos pasos"
}`,
      }],
    })

    const raw   = (msg.content[0] as { text: string }).text.trim()
    const first = raw.indexOf('{')
    const last  = raw.lastIndexOf('}')
    if (first === -1 || last === -1) {
      res.status(500).json({ success: false, error: 'La IA devolvió una respuesta inesperada. Inténtalo de nuevo.' })
      return
    }

    const analysis = JSON.parse(raw.slice(first, last + 1)) as AnalysisResult
    res.json({ success: true, data: { analysis, rowCount: rows.length } })
  } catch (err) {
    console.error('[metaAnalysis] Error:', err)
    const msg = err instanceof Error ? err.message : 'Error al analizar las campañas.'
    res.status(500).json({ success: false, error: msg })
  }
}
