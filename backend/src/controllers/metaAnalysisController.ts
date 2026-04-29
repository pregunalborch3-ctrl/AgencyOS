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

// ─── Normalize column names from Meta Ads exports ────────────────────────────
const COL_ALIASES: Record<string, string[]> = {
  campaign:    ['Campaign name', 'Nombre de la campaña', 'Campaña', 'Campaign'],
  adset:       ['Ad Set Name', 'Nombre del conjunto de anuncios', 'Conjunto de anuncios'],
  ad:          ['Ad Name', 'Nombre del anuncio', 'Anuncio'],
  spend:       ['Amount spent (EUR)', 'Amount spent (USD)', 'Importe gastado (EUR)', 'Importe gastado', 'Amount Spent', 'Spend', 'Gasto'],
  impressions: ['Impressions', 'Impresiones'],
  reach:       ['Reach', 'Alcance'],
  clicks:      ['Clicks (all)', 'Clics (todos)', 'Link clicks', 'Clics en el enlace', 'Clicks'],
  ctr:         ['CTR (all)', 'CTR (todos)', 'CTR (link click-through rate)', 'CTR'],
  cpc:         ['CPC (all)', 'CPC (todos)', 'CPC (cost per link click)', 'CPC'],
  cpm:         ['CPM (cost per 1,000 impressions)', 'CPM (coste por 1.000 impresiones)', 'CPM'],
  roas:        ['Purchase ROAS (return on ad spend)', 'ROAS de compras', 'ROAS'],
  results:     ['Results', 'Resultados'],
  costPerResult: ['Cost per result', 'Coste por resultado'],
  frequency:   ['Frequency', 'Frecuencia'],
  purchases:   ['Purchases', 'Compras', 'Purchase'],
}

function findCol(row: Record<string, string>, aliases: string[]): string {
  for (const alias of aliases) {
    if (row[alias] !== undefined) return alias
  }
  // Fuzzy: try case-insensitive substring
  const rowKeys = Object.keys(row)
  for (const alias of aliases) {
    const found = rowKeys.find(k => k.toLowerCase().includes(alias.toLowerCase()))
    if (found) return found
  }
  return ''
}

function resolveRow(row: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [key, aliases] of Object.entries(COL_ALIASES)) {
    const col = findCol(row, aliases)
    out[key] = col ? (row[col] ?? '') : ''
  }
  return out
}

function num(v: string): number {
  if (!v) return NaN
  return parseFloat(v.replace(/[€$£%,\s]/g, '').replace(',', '.'))
}

// ─── Build a compact summary for Claude ──────────────────────────────────────
function buildDataSummary(rows: Array<Record<string, string>>): string {
  const normalized = rows.map(resolveRow)

  // Group by campaign
  const campaigns: Record<string, {
    spend: number; impressions: number; clicks: number; purchases: number
    roas: number[]; ctr: number[]; cpc: number[]; cpm: number[]; rows: number
  }> = {}

  for (const r of normalized) {
    const name = r['campaign'] || 'Sin nombre'
    if (!campaigns[name]) {
      campaigns[name] = { spend: 0, impressions: 0, clicks: 0, purchases: 0, roas: [], ctr: [], cpc: [], cpm: [], rows: 0 }
    }
    const c = campaigns[name]
    c.rows++
    c.spend       += num(r['spend']) || 0
    c.impressions += num(r['impressions']) || 0
    c.clicks      += num(r['clicks']) || 0
    c.purchases   += num(r['purchases']) || 0
    const roas = num(r['roas']); if (!isNaN(roas) && roas > 0) c.roas.push(roas)
    const ctr  = num(r['ctr']);  if (!isNaN(ctr)  && ctr  > 0) c.ctr.push(ctr)
    const cpc  = num(r['cpc']);  if (!isNaN(cpc)  && cpc  > 0) c.cpc.push(cpc)
    const cpm  = num(r['cpm']);  if (!isNaN(cpm)  && cpm  > 0) c.cpm.push(cpm)
  }

  const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null

  const lines = Object.entries(campaigns).map(([name, c]) => {
    const ctr  = avg(c.ctr)
    const cpc  = avg(c.cpc)
    const cpm  = avg(c.cpm)
    const roas = avg(c.roas)
    const cpa  = c.purchases > 0 ? c.spend / c.purchases : null
    return [
      `Campaña: "${name}"`,
      `  Gasto: €${c.spend.toFixed(2)} | Impresiones: ${c.impressions.toLocaleString('es')} | Clics: ${c.clicks}`,
      ctr  != null ? `  CTR: ${ctr.toFixed(2)}%`       : '',
      cpc  != null ? `  CPC: €${cpc.toFixed(2)}`        : '',
      cpm  != null ? `  CPM: €${cpm.toFixed(2)}`        : '',
      roas != null ? `  ROAS: ${roas.toFixed(2)}x`      : '',
      c.purchases > 0 ? `  Compras: ${c.purchases} | CPA: €${(cpa!).toFixed(2)}` : '',
    ].filter(Boolean).join('\n')
  })

  return lines.join('\n\n')
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

    const dataSummary = buildDataSummary(rows)
    const columnsList = Object.keys(rows[0]).slice(0, 30).join(', ')

    const client = getClient()
    const msg = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      system: 'Eres un experto analista de Meta Ads con 10 años de experiencia. Analizas datos reales de campañas y das recomendaciones accionables. Responde SOLO con JSON válido, sin markdown.',
      messages: [{
        role: 'user',
        content: `Analiza estos datos reales de Meta Ads Manager y devuelve un análisis completo en JSON.

COLUMNAS DETECTADAS: ${columnsList}

DATOS POR CAMPAÑA:
${dataSummary}

BENCHMARKS DE REFERENCIA (ecommerce España):
- CTR Feed: 0.9%–2.5% (bueno >1.5%)
- CTR Stories: 0.5%–1.5% (bueno >0.8%)
- CPC Feed: €0.30–€1.20 (bueno <€0.70)
- CPM: €5–€20 (bueno <€12)
- ROAS: objetivo mínimo 2.0x, bueno >3.5x
- CPA: depende del producto, evalúa en relación al AOV

Devuelve este JSON exacto (en español, basado en los datos reales):
{
  "summary": "resumen ejecutivo de 2-3 frases sobre el estado general de las campañas",
  "performingWell": [
    { "name": "nombre exacto campaña", "reason": "por qué va bien con datos concretos", "highlight": "la métrica más destacada con valor" }
  ],
  "performingPoorly": [
    { "name": "nombre exacto campaña", "reason": "problema principal con datos concretos", "action": "acción inmediata a tomar" }
  ],
  "belowAverage": [
    { "metric": "nombre métrica", "value": "valor actual promedio", "benchmark": "valor de referencia", "fix": "cómo mejorarlo en 1-2 frases" }
  ],
  "recommendations": [
    { "priority": "alta", "title": "título acción", "description": "descripción concreta de qué hacer y cómo" },
    { "priority": "media", "title": "...", "description": "..." },
    { "priority": "baja",  "title": "...", "description": "..." }
  ],
  "executiveSummary": "párrafo de 4-6 frases listo para presentar al cliente, sin jerga técnica, enfocado en resultados de negocio y próximos pasos"
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
