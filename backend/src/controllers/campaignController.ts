import { Request, Response } from 'express'
import { v4 as uuid } from 'uuid'
import Anthropic from '@anthropic-ai/sdk'
import { prisma, UserStore } from '../models/User'

// ─── Anthropic client (lazy — reads env at call time) ─────────────────────────
function getClient(): Anthropic {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) throw new Error('ANTHROPIC_API_KEY no está configurada.')
  return new Anthropic({ apiKey: key })
}

// ─── Niche data (used as context for Claude) ──────────────────────────────────
const NICHE_DATA: Record<string, {
  pains: string[]
  desires: string[]
  profile: string
  interests: string[]
  behaviors: string[]
  ageRange: string
  gender: string
}> = {
  ropa: {
    pains: ['gastar dinero en ropa que no sienta bien', 'no encontrar su estilo', 'comprar online y que no sea lo que esperaba', 'las tallas no ser fiables'],
    desires: ['verse bien sin esfuerzo', 'encontrar ropa que dure', 'tener un estilo propio', 'sentirse segura con lo que lleva'],
    profile: 'Mujeres/hombres 22–38 interesados en moda y lifestyle',
    interests: ['Moda', 'Zara', 'H&M', 'Instagram Fashion', 'Tendencias', 'Compras online'],
    behaviors: ['Compradores de moda online', 'Usuarios activos de Instagram', 'Compradores frecuentes'],
    ageRange: '22–38', gender: 'Principalmente mujeres (65%), hombres (35%)',
  },
  calzado: {
    pains: ['zapatillas que se desgastan rápido', 'pies doloridos al final del día', 'no encontrar calzado cómodo Y estético', 'tallas que no corresponden'],
    desires: ['comodidad todo el día', 'calzado que dure meses', 'verse bien en cualquier ocasión', 'calidad por precio justo'],
    profile: 'Adultos 25–45 que priorizan calidad y comodidad',
    interests: ['Running', 'Sneakers', 'Lifestyle', 'Fitness', 'Moda urbana'],
    behaviors: ['Compradores de calzado deportivo', 'Interesados en bienestar', 'Compradores de marca'],
    ageRange: '25–45', gender: 'Mixto (55% hombres, 45% mujeres)',
  },
  belleza: {
    pains: ['productos que prometen mucho y no cumplen', 'piel sensible que reacciona mal', 'gastar dinero en rutinas que no funcionan', 'no saber qué productos usar'],
    desires: ['piel sana y luminosa', 'rutina de belleza simple que funcione', 'productos naturales sin tóxicos', 'resultados visibles en días'],
    profile: 'Mujeres 20–40 interesadas en skincare y autocuidado',
    interests: ['Skincare', 'Belleza natural', 'Bienestar', 'YouTube Beauty', 'TikTok Beauty'],
    behaviors: ['Compradoras de cosméticos online', 'Usuarias frecuentes de redes', 'Interesadas en bienestar'],
    ageRange: '20–40', gender: 'Principalmente mujeres (85%)',
  },
  fitness: {
    pains: ['empezar y dejarlo a las 2 semanas', 'no ver resultados después de meses', 'no saber qué entrenar', 'suplementos caros que no funcionan'],
    desires: ['cuerpo tonificado visible', 'más energía en el día a día', 'rutina sostenible a largo plazo', 'resultados rápidos y medibles'],
    profile: 'Adultos 25–40 activos o que quieren empezar a serlo',
    interests: ['Gym', 'Fitness', 'Nutrición deportiva', 'CrossFit', 'Running', 'Suplementación'],
    behaviors: ['Compradores de suplementos', 'Usuarios de apps de fitness', 'Interesados en deporte'],
    ageRange: '25–40', gender: 'Mixto (60% hombres, 40% mujeres)',
  },
  hogar: {
    pains: ['casa que no refleja quién eres', 'productos de decoración caros y de baja calidad', 'no saber cómo combinar estilos', 'muebles que no duran'],
    desires: ['hogar bonito sin gastar una fortuna', 'ambiente acogedor y personal', 'productos que duren años', 'estilo coherente en todos los espacios'],
    profile: 'Adultos 28–45 con hogar propio o en proceso de decorarlo',
    interests: ['Decoración', 'Interiorismo', 'Pinterest Home', 'DIY', 'Lifestyle'],
    behaviors: ['Compradores de hogar online', 'Usuarios de Pinterest', 'Interesados en decoración'],
    ageRange: '28–45', gender: 'Principalmente mujeres (70%)',
  },
  tecnologia: {
    pains: ['dispositivos lentos que ralentizan su trabajo', 'gadgets que se rompen al año', 'no saber qué tecnología elegir', 'pagar demasiado por algo que no necesitan'],
    desires: ['productividad al máximo', 'tecnología que simplifique su vida', 'relación calidad-precio real', 'soporte post-compra de verdad'],
    profile: 'Profesionales y entusiastas de la tecnología 25–45',
    interests: ['Tech', 'Gadgets', 'Productividad', 'Apple', 'Android', 'Gaming'],
    behaviors: ['Early adopters', 'Compradores de electrónica online', 'Profesionales digitales'],
    ageRange: '25–45', gender: 'Principalmente hombres (65%)',
  },
  alimentacion: {
    pains: ['comer sano es complicado y caro', 'no tener tiempo para cocinar bien', 'no saber qué es realmente saludable', 'perder peso y recuperarlo'],
    desires: ['alimentación simple y nutritiva', 'más energía y menos inflamación', 'recetas fáciles que gusten a toda la familia', 'resultados visibles en el cuerpo'],
    profile: 'Adultos 28–50 conscientes de su salud y bienestar',
    interests: ['Nutrición', 'Vida saludable', 'Recetas', 'Bienestar', 'Dieta mediterránea'],
    behaviors: ['Compradores de productos saludables', 'Interesados en bienestar', 'Usuarios de apps de dieta'],
    ageRange: '28–50', gender: 'Principalmente mujeres (60%)',
  },
  joyeria: {
    pains: ['joyería cara que se oxida', 'regalo genérico sin significado', 'no encontrar piezas únicas', 'metales que irritan la piel'],
    desires: ['joyería que dure para siempre', 'piezas únicas con significado', 'regalo que impacte de verdad', 'calidad premium sin precio desorbitado'],
    profile: 'Mujeres 25–45 y personas buscando regalos especiales',
    interests: ['Joyería', 'Moda', 'Lujo accesible', 'Regalos', 'Accesorios'],
    behaviors: ['Compradores de regalos online', 'Interesados en accesorios', 'Compradores de lujo moderado'],
    ageRange: '25–45', gender: 'Principalmente mujeres (75%)',
  },
  mascotas: {
    pains: ['productos de baja calidad que perjudican la salud del animal', 'no saber qué es mejor para su mascota', 'veterinario caro por problemas prevenibles', 'productos que no duran'],
    desires: ['mascota sana y feliz', 'tranquilidad de estar dando lo mejor', 'productos naturales y seguros', 'solución práctica para el día a día'],
    profile: 'Dueños de mascotas 25–45 que tratan al animal como familia',
    interests: ['Mascotas', 'Perros', 'Gatos', 'Vida saludable', 'Bienestar animal'],
    behaviors: ['Dueños de mascotas', 'Compradores de productos para animales', 'Usuarios de comunidades de mascotas'],
    ageRange: '25–45', gender: 'Principalmente mujeres (60%)',
  },
  deportes: {
    pains: ['equipamiento que se rompe a los meses', 'rendimiento estancado sin saber por qué', 'lesiones por material inadecuado', 'marcas caras que no aportan diferencia real'],
    desires: ['rendir al máximo en cada entreno', 'material que aguante años', 'ventaja real sobre el resto', 'recuperación más rápida'],
    profile: 'Deportistas 20–40 comprometidos con su rendimiento',
    interests: ['Deporte', 'Running', 'Ciclismo', 'Natación', 'Trail', 'Rendimiento deportivo'],
    behaviors: ['Atletas amateur y semi-pro', 'Compradores de equipamiento deportivo', 'Usuarios de apps de deporte'],
    ageRange: '20–40', gender: 'Mixto (55% hombres, 45% mujeres)',
  },
}

const DEFAULT_NICHE = NICHE_DATA['ropa']

// ─── Claude JSON helper ───────────────────────────────────────────────────────
const CLAUDE_TIMEOUT_MS = 30_000

async function claudeJSON<T>(system: string, user: string): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(
      () => reject(new Error('La IA tardó demasiado. Por favor, inténtalo de nuevo.')),
      CLAUDE_TIMEOUT_MS,
    ),
  )
  const msg = await Promise.race([
    getClient().messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      system,
      messages: [{ role: 'user', content: user }],
    }),
    timeout,
  ])
  const raw = (msg.content[0] as { type: string; text: string }).text.trim()
  const clean = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
  try {
    return JSON.parse(clean) as T
  } catch {
    throw new Error('La IA devolvió una respuesta inesperada. Inténtalo de nuevo.')
  }
}

// ─── Generate creatives with Claude ──────────────────────────────────────────
interface ShortCopy { hook: string; body: string; cta: string; type: string; platform: string }
interface LongCopy  { format: string; platform: string; content: string }
interface Hook      { type: string; text: string; why: string }
interface Creative  { format: string; platform: string; duration: string; structure: Array<{ time: string; action: string }> }

async function generateCreativesWithClaude(
  product: string,
  niche: typeof DEFAULT_NICHE,
  objective: string,
  campaignStyle: string,
  variant: string,
): Promise<{ shortCopies: ShortCopy[]; longCopies: LongCopy[]; hooks: Hook[]; creatives: Creative[] }> {
  const variantContext: Record<string, string> = {
    '':           'Tono profesional, equilibrado, persuasivo pero no agresivo.',
    'agresivo':   'Tono muy directo y agresivo. FOMO intenso, urgencia extrema, presión psicológica alta. Frases cortas y contundentes.',
    'conversion': 'Enfocado 100% en conversión: incluye garantías, elimina objeciones, usa prueba social concreta, urgencia real (no ficticia).',
    'tiktok':     'Tono nativo de TikTok: viral, entretenido, hooks ultra-cortos (<8 palabras), lenguaje generacional, emojis estratégicos, formato POV o "espera, qué?".',
  }

  const ctaMap: Record<string, string[]> = {
    ventas:  ['Comprar ahora →', 'Conseguirlo aquí →', 'Quiero el mío →', 'Aprovecha la oferta →'],
    leads:   ['Solicitar info →', 'Quiero saber más →', 'Reservar mi plaza →', 'Hablar con un experto →'],
    trafico: ['Ver más →', 'Descúbrelo →', 'Leer el artículo →', 'Explorar →'],
  }
  const ctas = ctaMap[objective] ?? ctaMap['ventas']

  const data = await claudeJSON<{
    shortCopies: ShortCopy[]
    longCopies: LongCopy[]
    hooks: Hook[]
    creatives: Creative[]
  }>(
    'Eres un experto copywriter en marketing de performance y publicidad de pago (Meta Ads, TikTok Ads, Google Ads). Escribes copy que convierte, no que suena bonito. Responde ÚNICAMENTE con JSON válido, sin markdown, sin comentarios.',
    `Crea material publicitario completo para este producto/tienda:

PRODUCTO: "${product}"
NICHO: ${niche.profile}
OBJETIVO DE CAMPAÑA: ${objective} (${objective === 'ventas' ? 'maximizar compras directas' : objective === 'leads' ? 'captar contactos cualificados' : 'llevar tráfico a la web'})
ESTILO: ${campaignStyle || 'performance'}
VARIANTE/TONO: ${variantContext[variant] ?? variantContext['']}

CONTEXTO DEL CLIENTE IDEAL:
- Dolores principales: ${niche.pains.join(' | ')}
- Deseos principales: ${niche.desires.join(' | ')}
- Perfil: ${niche.profile}

CTAs disponibles (usa solo estos): ${ctas.join(', ')}

Devuelve EXACTAMENTE este JSON:
{
  "shortCopies": [
    {
      "type": "Curiosidad",
      "platform": "Meta Ads · Feed",
      "hook": "titular que para el scroll (máx 12 palabras)",
      "body": "cuerpo del anuncio (2-3 frases, máx 80 palabras)",
      "cta": "uno de los CTAs disponibles"
    },
    {
      "type": "Problema–Solución",
      "platform": "Meta Ads · Stories",
      "hook": "...",
      "body": "...",
      "cta": "..."
    },
    {
      "type": "Prueba Social",
      "platform": "TikTok Ads",
      "hook": "...",
      "body": "...",
      "cta": "..."
    },
    {
      "type": "Urgencia",
      "platform": "Meta Ads · Reels",
      "hook": "...",
      "body": "...",
      "cta": "..."
    },
    {
      "type": "Identidad",
      "platform": "Meta Ads · Feed",
      "hook": "...",
      "body": "...",
      "cta": "..."
    }
  ],
  "longCopies": [
    {
      "format": "Storytelling emocional",
      "platform": "Meta Ads · Feed largo",
      "content": "copy largo de 150-220 palabras en formato storytelling. Usa saltos de línea para legibilidad. Empieza con una historia real de un cliente."
    },
    {
      "format": "Problema–Agitación–Solución",
      "platform": "Meta Ads · Video Copy",
      "content": "copy largo de 150-220 palabras en formato PAS. Agita el dolor antes de presentar la solución."
    }
  ],
  "hooks": [
    { "type": "Curiosidad extrema", "text": "hook listo para usar (máx 10 palabras)", "why": "por qué funciona psicológicamente (1 frase)" },
    { "type": "Dolor directo", "text": "...", "why": "..." },
    { "type": "FOMO + Prueba social", "text": "...", "why": "..." },
    { "type": "Transformación", "text": "...", "why": "..." },
    { "type": "Patrón de interrupción", "text": "...", "why": "..." }
  ],
  "creatives": [
    {
      "format": "UGC — Testimonial espontáneo",
      "platform": "TikTok / Reels",
      "duration": "15–20 segundos",
      "structure": [
        { "time": "0–3s", "action": "descripción de lo que ocurre en pantalla" },
        { "time": "3–7s", "action": "..." },
        { "time": "7–12s", "action": "..." },
        { "time": "12–15s", "action": "..." },
        { "time": "15–20s", "action": "..." }
      ]
    },
    {
      "format": "Before/After — Transformación visual",
      "platform": "TikTok / Reels / Meta Stories",
      "duration": "10–15 segundos",
      "structure": [
        { "time": "0–2s", "action": "..." },
        { "time": "2–5s", "action": "..." },
        { "time": "5–10s", "action": "..." },
        { "time": "10–13s", "action": "..." },
        { "time": "13–15s", "action": "..." }
      ]
    },
    {
      "format": "Hook educacional agresivo",
      "platform": "TikTok Ads / YouTube Pre-roll",
      "duration": "20–30 segundos",
      "structure": [
        { "time": "0–3s", "action": "..." },
        { "time": "3–8s", "action": "..." },
        { "time": "8–15s", "action": "..." },
        { "time": "15–22s", "action": "..." },
        { "time": "22–28s", "action": "..." },
        { "time": "28–30s", "action": "..." }
      ]
    }
  ]
}

Todo el contenido en español. Adapta CADA pieza específicamente al producto "${product}". No uses textos genéricos.`,
  )

  return data
}

// ─── Structural functions (template-based, no IA needed) ──────────────────────
function buildCampaignStructure(objective: string): {
  type: string
  funnel: Array<{ stage: string; objective: string; audience: string; budget: string; format: string }>
  totalBudgetSuggestion: string
  notes: string
} {
  const funnelMap: Record<string, Array<{ stage: string; objective: string; audience: string; budget: string; format: string }>> = {
    ventas: [
      { stage: 'TOF — Frío',     objective: 'Alcance / Video Views',     audience: 'Intereses fríos + Lookalike 1%',         budget: '30%', format: 'Vídeo UGC 15–20s' },
      { stage: 'MOF — Templado', objective: 'Tráfico / Interacción',     audience: 'Engagement 30d + Visitantes web',         budget: '25%', format: 'Carrusel + Imagen estática' },
      { stage: 'BOF — Caliente', objective: 'Conversiones (Compra)',     audience: 'Visitantes sin compra últimos 14d',       budget: '35%', format: 'Imagen 1:1 + copy directo' },
      { stage: 'Retención',      objective: 'Compra repetida / Upsell',  audience: 'Clientes últimos 180d',                   budget: '10%', format: 'Story + Copy personalizado' },
    ],
    leads: [
      { stage: 'TOF — Frío',     objective: 'Alcance / Reconocimiento',  audience: 'Intereses fríos del nicho',               budget: '35%', format: 'Vídeo educacional 20–30s' },
      { stage: 'MOF — Templado', objective: 'Generación de leads',       audience: 'Engagement 60d + Visitantes web',         budget: '40%', format: 'Lead Ad + landing page' },
      { stage: 'BOF — Caliente', objective: 'Lead cualificado',          audience: 'Leads sin convertir últimos 30d',         budget: '25%', format: 'Copy largo + prueba social' },
    ],
    trafico: [
      { stage: 'TOF — Frío',     objective: 'Tráfico al sitio web',      audience: 'Intereses amplios del nicho',             budget: '50%', format: 'Imagen + copy de curiosidad' },
      { stage: 'MOF — Templado', objective: 'Páginas vistas + tiempo',   audience: 'Visitantes rápidos + interacción previa', budget: '30%', format: 'Vídeo corto + link' },
      { stage: 'BOF — Caliente', objective: 'Retargeting y conversión',  audience: 'Visitantes de más de 30s últimos 7d',     budget: '20%', format: 'Carrusel + urgencia' },
    ],
  }

  const typeMap: Record<string, string> = {
    ventas:  'Campaña de Conversiones — Evento: Purchase',
    leads:   'Campaña de Generación de Leads — Evento: Lead',
    trafico: 'Campaña de Tráfico — Destino: Sitio web',
  }

  return {
    type: typeMap[objective] ?? typeMap['ventas'],
    funnel: funnelMap[objective] ?? funnelMap['ventas'],
    totalBudgetSuggestion: objective === 'ventas'
      ? '€30–€80 / día para empezar. Escalar cuando ROAS > 2.5x.'
      : '€20–€50 / día. Optimizar CPL antes de escalar.',
    notes: 'Lanzar TOF y BOF simultáneamente. Revisar frecuencia a los 3 días. Pausar anuncios con CTR < 1.5%. Duplicar los ganadores con presupuesto +30%.',
  }
}

function buildSegmentation(niche: typeof DEFAULT_NICHE, product: string) {
  return {
    profile: niche.profile,
    ageRange: niche.ageRange,
    gender: niche.gender,
    interests: niche.interests,
    behaviors: niche.behaviors,
    pains: niche.pains,
    desires: niche.desires,
    lookalike: ['Compradores recientes (180d)', `Visitantes de ${product} (30d)`, 'Clientes de alto valor (LTV top 25%)'],
    exclude: ['Compradores recientes (14d)', 'Empleados propios', 'Competencia directa'],
  }
}

function buildInsight(
  niche: typeof DEFAULT_NICHE,
  objective: string,
  campaignStyle: string,
  variant: string,
): { angle: string; clientType: string; aggressiveness: string } {
  const base: Record<string, string> = {
    ventas_performance:  'Problema–Solución con urgencia y conversión directa',
    ventas_ugc:          'Prueba social auténtica + transformación real',
    ventas_branding:     'Aspiracional con posicionamiento de marca premium',
    leads_performance:   'Captura de deseo + CTA de baja fricción',
    leads_ugc:           'Testimonial real + generación de confianza',
    leads_branding:      'Autoridad de marca + propuesta de valor clara',
    trafico_performance: 'Curiosidad + contenido de valor informativo',
    trafico_ugc:         'Demostración orgánica + alcance viral',
    trafico_branding:    'Reconocimiento de marca + contenido educativo',
  }
  let angle = base[`${objective}_${campaignStyle || 'performance'}`] ?? 'Problema–Solución con urgencia'
  if (variant === 'agresivo')   angle = 'Dolor directo + FOMO con máxima presión psicológica'
  if (variant === 'conversion') angle = 'Conversión directa con garantía + eliminación de objeciones'
  if (variant === 'tiktok')     angle = 'Entretenimiento viral + disrupción de scroll'

  const aggr: Record<string, string> = {
    agresivo: 'Alto', conversion: 'Alto', tiktok: 'Medio', '': objective === 'ventas' ? 'Medio' : 'Bajo',
  }
  return { angle, clientType: niche.profile, aggressiveness: aggr[variant] ?? 'Medio' }
}

// ─── Controller ───────────────────────────────────────────────────────────────
export async function generateCampaign(req: Request, res: Response): Promise<void> {
  const { productDescription, productUrl, niche, objective, campaignStyle, variant } = req.body as {
    productDescription?: string
    productUrl?: string
    niche?: string
    objective?: string
    campaignStyle?: string
    variant?: string
  }

  if (!productDescription?.trim() && !productUrl?.trim()) {
    res.status(400).json({ success: false, error: 'Introduce una descripción del producto o URL de la tienda.' })
    return
  }
  if (!niche?.trim()) {
    res.status(400).json({ success: false, error: 'Selecciona un nicho.' })
    return
  }
  if (!objective?.trim()) {
    res.status(400).json({ success: false, error: 'Selecciona el objetivo de la campaña.' })
    return
  }

  // ── Acceso: suscripción activa o primera campaña gratuita ──────────────────
  if (!variant) {
    const user = await UserStore.findById((req as { user?: { userId: string } }).user!.userId)
    if (!user) {
      res.status(401).json({ success: false, error: 'Usuario no encontrado.' })
      return
    }
    const status = user.subscription?.status
    const isActive = status === 'active' || status === 'trialing' || user.role === 'admin'

    if (!isActive) {
      if (user.freeUsed) {
        res.status(403).json({ success: false, error: 'FREE_LIMIT_REACHED' })
        return
      }
      await UserStore.update(user.id, { freeUsed: true })
    }
  }

  // Build product name from input
  const rawInput = productDescription?.trim() || productUrl?.replace(/https?:\/\//, '').split('/')[0] || 'tu producto'
  const words = rawInput
    .split(/[\s,—·]+/)
    .filter(w => w.length > 1 && !/^\d+$/.test(w) && !/^[€$£%]/.test(w) && !/^(para|de|en|con|sin|y|o|a|el|la|los|las|mujer|hombre|chica|chico|niño|niña|adulto)$/i.test(w))
    .slice(0, 3)
  const product = words.length
    ? words[0].charAt(0).toUpperCase() + words[0].slice(1) + (words.length > 1 ? ' ' + words.slice(1).join(' ') : '')
    : 'tu producto'

  const nicheKey  = (niche ?? '').toLowerCase()
  const nicheData = NICHE_DATA[nicheKey] ?? DEFAULT_NICHE

  try {
    const { shortCopies, longCopies, hooks, creatives } = await generateCreativesWithClaude(
      rawInput, nicheData, objective!, campaignStyle ?? '', variant ?? '',
    )

    const campaign = {
      id: uuid(),
      generatedAt: new Date().toISOString(),
      input: { productDescription, productUrl, niche, objective, campaignStyle, variant },
      insight:           buildInsight(nicheData, objective!, campaignStyle ?? '', variant ?? ''),
      shortCopies,
      longCopies,
      hooks,
      creatives,
      campaignStructure: buildCampaignStructure(objective!),
      segmentation:      buildSegmentation(nicheData, product),
    }

    res.json({ success: true, data: campaign })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error generando la campaña.'
    res.status(500).json({ success: false, error: msg })
  }
}

// ─── CRUD Campañas ────────────────────────────────────────────────────────────
export async function saveCampaign(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId
    const { name, niche, objective, data } = req.body as {
      name: string; niche: string; objective: string; data: unknown
    }

    if (!name || !niche || !objective || !data) {
      res.status(400).json({ success: false, error: 'Faltan campos requeridos: name, niche, objective, data.' })
      return
    }

    const saved = await prisma.campaign.create({
      data: { userId, name, niche, objective, data }
    })

    res.status(201).json({ success: true, data: saved })
  } catch {
    res.status(500).json({ success: false, error: 'Error al guardar la campaña.' })
  }
}

export async function getCampaigns(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId
    const limit  = Math.min(Number(req.query.limit) || 20, 100)
    const cursor = req.query.cursor as string | undefined

    const campaigns = await prisma.campaign.findMany({
      where:   { userId },
      orderBy: { createdAt: 'desc' },
      take:    limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select:  { id: true, name: true, niche: true, objective: true, createdAt: true, data: true },
    })

    const hasMore    = campaigns.length > limit
    const items      = hasMore ? campaigns.slice(0, limit) : campaigns
    const nextCursor = hasMore ? items[items.length - 1].id : null

    res.json({ success: true, data: items, meta: { hasMore, nextCursor } })
  } catch {
    res.status(500).json({ success: false, error: 'Error al obtener las campañas.' })
  }
}

export async function deleteCampaign(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId
    const { id } = req.params

    const campaign = await prisma.campaign.findUnique({ where: { id } })

    if (!campaign) {
      res.status(404).json({ success: false, error: 'Campaña no encontrada.' })
      return
    }
    if (campaign.userId !== userId) {
      res.status(403).json({ success: false, error: 'No tienes permiso para eliminar esta campaña.' })
      return
    }

    await prisma.campaign.delete({ where: { id } })
    res.json({ success: true, data: { id } })
  } catch {
    res.status(500).json({ success: false, error: 'Error al eliminar la campaña.' })
  }
}
