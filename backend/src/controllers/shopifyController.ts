import { Request, Response } from 'express'

// ─── SSRF protection ──────────────────────────────────────────────────────────
const BLOCKED_HOSTNAMES = new Set([
  'localhost', '127.0.0.1', '::1', '0.0.0.0',
  // Cloud metadata endpoints
  '169.254.169.254', 'metadata.google.internal', 'metadata.azure.com',
])

const PRIVATE_IP_RE = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2[0-9]|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./,
  /^0\./,
  /^::1$/,
  /^fc[\da-f]{2}:/i,
  /^fd[\da-f]{2}:/i,
  /^fe80:/i,
]

function isSsrfTarget(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/\.+$/, '')
  if (BLOCKED_HOSTNAMES.has(h)) return true
  return PRIVATE_IP_RE.some(re => re.test(h))
}

interface ShopifyAnalysis {
  productName: string
  description: string
  brand: string
  price: string
  category: string
  suggestedDescription: string
}

function extractMeta(html: string, name: string): string {
  const patterns = [
    new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${name}["']`, 'i'),
    new RegExp(`<meta[^>]+property=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${name}["']`, 'i'),
  ]
  for (const re of patterns) {
    const m = html.match(re)
    if (m?.[1]) return m[1].trim()
  }
  return ''
}

function extractTitle(html: string): string {
  const og = extractMeta(html, 'og:title')
  if (og) return og
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  return m?.[1]?.trim() ?? ''
}

function cleanText(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export async function analyzeShopifyUrl(req: Request, res: Response): Promise<void> {
  const { url } = req.body as { url?: string }

  if (!url?.trim()) {
    res.status(400).json({ success: false, error: 'URL requerida.' })
    return
  }

  let parsedUrl: URL
  try {
    parsedUrl = new URL(url.startsWith('http') ? url : `https://${url}`)
  } catch {
    res.status(400).json({ success: false, error: 'URL no válida.' })
    return
  }

  if (parsedUrl.protocol !== 'https:') {
    res.status(400).json({ success: false, error: 'Solo se permiten URLs con HTTPS.' })
    return
  }

  if (isSsrfTarget(parsedUrl.hostname)) {
    res.status(400).json({ success: false, error: 'URL no permitida.' })
    return
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)

    const response = await fetch(parsedUrl.toString(), {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AgencyOS/1.0; +https://agencyos.com)',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
      },
    })
    clearTimeout(timeout)

    if (!response.ok) {
      res.status(400).json({ success: false, error: `La URL no es accesible (código ${response.status}).` })
      return
    }

    const html = await response.text()

    const title       = cleanText(extractTitle(html))
    const description = cleanText(extractMeta(html, 'description') || extractMeta(html, 'og:description'))
    const siteName    = cleanText(extractMeta(html, 'og:site_name'))
    const image       = extractMeta(html, 'og:image')

    // Extract price if present (Shopify pattern)
    const priceMatch = html.match(/["']price["'][^>]*>[\s]*([€$£]?\s*\d[\d.,]+)/i)
      || html.match(/class=["'][^"']*price[^"']*["'][^>]*>\s*([€$£]?\s*\d[\d.,]+)/i)
    const price = priceMatch?.[1]?.trim() ?? ''

    // Build suggested description for the campaign generator
    const parts: string[] = []
    if (title)       parts.push(title)
    if (description) parts.push(description)
    if (price)       parts.push(`Precio: ${price}`)
    if (siteName)    parts.push(`Marca: ${siteName}`)

    const suggestedDescription = parts.slice(0, 3).join('. ')

    const result: ShopifyAnalysis = {
      productName: title || parsedUrl.hostname,
      description: description || '',
      brand: siteName || parsedUrl.hostname.replace('www.', '').split('.')[0],
      price,
      category: '',
      suggestedDescription: suggestedDescription || title || parsedUrl.hostname,
    }

    res.json({ success: true, data: { ...result, imageUrl: image } })
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      res.status(408).json({ success: false, error: 'La URL tardó demasiado en responder. Intenta con la descripción manual.' })
      return
    }
    res.status(500).json({ success: false, error: 'No se pudo acceder a la URL. Usa la descripción manual.' })
  }
}
