import { Request, Response } from 'express'
import { v4 as uuid } from 'uuid'
import { prisma } from '../models/User'

// ─── Niche data ───────────────────────────────────────────────────────────────
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
    ageRange: '22–38',
    gender: 'Principalmente mujeres (65%), hombres (35%)',
  },
  calzado: {
    pains: ['zapatillas que se desgastan rápido', 'pies doloridos al final del día', 'no encontrar calzado cómodo Y estético', 'tallas que no corresponden'],
    desires: ['comodidad todo el día', 'calzado que dure meses', 'verse bien en cualquier ocasión', 'calidad por precio justo'],
    profile: 'Adultos 25–45 que priorizan calidad y comodidad',
    interests: ['Running', 'Sneakers', 'Lifestyle', 'Fitness', 'Moda urbana'],
    behaviors: ['Compradores de calzado deportivo', 'Interesados en bienestar', 'Compradores de marca'],
    ageRange: '25–45',
    gender: 'Mixto (55% hombres, 45% mujeres)',
  },
  belleza: {
    pains: ['productos que prometen mucho y no cumplen', 'piel sensible que reacciona mal', 'gastar dinero en rutinas que no funcionan', 'no saber qué productos usar'],
    desires: ['piel sana y luminosa', 'rutina de belleza simple que funcione', 'productos naturales sin tóxicos', 'resultados visibles en días'],
    profile: 'Mujeres 20–40 interesadas en skincare y autocuidado',
    interests: ['Skincare', 'Belleza natural', 'Bienestar', 'YouTube Beauty', 'TikTok Beauty'],
    behaviors: ['Compradoras de cosméticos online', 'Usuarias frecuentes de redes', 'Interesadas en bienestar'],
    ageRange: '20–40',
    gender: 'Principalmente mujeres (85%)',
  },
  fitness: {
    pains: ['empezar y dejarlo a las 2 semanas', 'no ver resultados después de meses', 'no saber qué entrenar', 'suplementos caros que no funcionan'],
    desires: ['cuerpo tonificado visible', 'más energía en el día a día', 'rutina sostenible a largo plazo', 'resultados rápidos y medibles'],
    profile: 'Adultos 25–40 activos o que quieren empezar a serlo',
    interests: ['Gym', 'Fitness', 'Nutrición deportiva', 'CrossFit', 'Running', 'Suplementación'],
    behaviors: ['Compradores de suplementos', 'Usuarios de apps de fitness', 'Interesados en deporte'],
    ageRange: '25–40',
    gender: 'Mixto (60% hombres, 40% mujeres)',
  },
  hogar: {
    pains: ['casa que no refleja quién eres', 'productos de decoración caros y de baja calidad', 'no saber cómo combinar estilos', 'muebles que no duran'],
    desires: ['hogar bonito sin gastar una fortuna', 'ambiente acogedor y personal', 'productos que duren años', 'estilo coherente en todos los espacios'],
    profile: 'Adultos 28–45 con hogar propio o en proceso de decorarlo',
    interests: ['Decoración', 'Interiorismo', 'Pinterest Home', 'DIY', 'Lifestyle'],
    behaviors: ['Compradores de hogar online', 'Usuarios de Pinterest', 'Interesados en decoración'],
    ageRange: '28–45',
    gender: 'Principalmente mujeres (70%)',
  },
  tecnologia: {
    pains: ['dispositivos lentos que ralentizan su trabajo', 'gadgets que se rompen al año', 'no saber qué tecnología elegir', 'pagar demasiado por algo que no necesitan'],
    desires: ['productividad al máximo', 'tecnología que simplifique su vida', 'relación calidad-precio real', 'soporte post-compra de verdad'],
    profile: 'Profesionales y entusiastas de la tecnología 25–45',
    interests: ['Tech', 'Gadgets', 'Productividad', 'Apple', 'Android', 'Gaming'],
    behaviors: ['Early adopters', 'Compradores de electrónica online', 'Profesionales digitales'],
    ageRange: '25–45',
    gender: 'Principalmente hombres (65%)',
  },
  alimentacion: {
    pains: ['comer sano es complicado y caro', 'no tener tiempo para cocinar bien', 'no saber qué es realmente saludable', 'perder peso y recuperarlo'],
    desires: ['alimentación simple y nutritiva', 'más energía y menos inflamación', 'recetas fáciles que gusten a toda la familia', 'resultados visibles en el cuerpo'],
    profile: 'Adultos 28–50 conscientes de su salud y bienestar',
    interests: ['Nutrición', 'Vida saludable', 'Recetas', 'Bienestar', 'Dieta mediterránea'],
    behaviors: ['Compradores de productos saludables', 'Interesados en bienestar', 'Usuarios de apps de dieta'],
    ageRange: '28–50',
    gender: 'Principalmente mujeres (60%)',
  },
  joyeria: {
    pains: ['joyería cara que se oxida', 'regalo genérico sin significado', 'no encontrar piezas únicas', 'metales que irritan la piel'],
    desires: ['joyería que dure para siempre', 'piezas únicas con significado', 'regalo que impacte de verdad', 'calidad premium sin precio desorbitado'],
    profile: 'Mujeres 25–45 y personas buscando regalos especiales',
    interests: ['Joyería', 'Moda', 'Lujo accesible', 'Regalos', 'Accesorios'],
    behaviors: ['Compradores de regalos online', 'Interesados en accesorios', 'Compradores de lujo moderado'],
    ageRange: '25–45',
    gender: 'Principalmente mujeres (75%)',
  },
  mascotas: {
    pains: ['productos de baja calidad que perjudican la salud del animal', 'no saber qué es mejor para su mascota', 'veterinario caro por problemas prevenibles', 'productos que no duran'],
    desires: ['mascota sana y feliz', 'tranquilidad de estar dando lo mejor', 'productos naturales y seguros', 'solución práctica para el día a día'],
    profile: 'Dueños de mascotas 25–45 que tratan al animal como familia',
    interests: ['Mascotas', 'Perros', 'Gatos', 'Vida saludable', 'Bienestar animal'],
    behaviors: ['Dueños de mascotas', 'Compradores de productos para animales', 'Usuarios de comunidades de mascotas'],
    ageRange: '25–45',
    gender: 'Principalmente mujeres (60%)',
  },
  deportes: {
    pains: ['equipamiento que se rompe a los meses', 'rendimiento estancado sin saber por qué', 'lesiones por material inadecuado', 'marcas caras que no aportan diferencia real'],
    desires: ['rendir al máximo en cada entreno', 'material que aguante años', 'ventaja real sobre el resto', 'recuperación más rápida'],
    profile: 'Deportistas 20–40 comprometidos con su rendimiento',
    interests: ['Deporte', 'Running', 'Ciclismo', 'Natación', 'Trail', 'Rendimiento deportivo'],
    behaviors: ['Atletas amateur y semi-pro', 'Compradores de equipamiento deportivo', 'Usuarios de apps de deporte'],
    ageRange: '20–40',
    gender: 'Mixto (55% hombres, 45% mujeres)',
  },
}

const DEFAULT_NICHE = NICHE_DATA['ropa']

// ─── Copy templates ───────────────────────────────────────────────────────────
function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function buildShortCopies(product: string, niche: typeof DEFAULT_NICHE, objective: string): Array<{
  hook: string; body: string; cta: string; type: string; platform: string
}> {
  const pain    = pickRandom(niche.pains)
  const desire  = pickRandom(niche.desires)
  const desire2 = pickRandom(niche.desires.filter(d => d !== desire))

  const ctaMap: Record<string, string[]> = {
    ventas:   ['Comprar ahora →', 'Conseguirlo aquí →', 'Quiero el mío →', 'Aprovecha la oferta →'],
    leads:    ['Solicitar info →', 'Quiero saber más →', 'Reservar mi plaza →', 'Hablar con un experto →'],
    trafico:  ['Ver más →', 'Descúbrelo →', 'Leer el artículo →', 'Explorar →'],
  }
  const ctas = ctaMap[objective] ?? ctaMap['ventas']

  return [
    {
      type: 'Curiosidad',
      platform: 'Meta Ads · Feed',
      hook: `¿Por qué miles de personas están eligiendo ${product} antes que cualquier otra opción?`,
      body: `No es casualidad. ${product} resuelve ${pain} de una vez por todas. ${desire2.charAt(0).toUpperCase() + desire2.slice(1)} — sin compromisos.`,
      cta: pickRandom(ctas),
    },
    {
      type: 'Problema–Solución',
      platform: 'Meta Ads · Stories',
      hook: `Cansado/a de ${pain}?`,
      body: `${product} fue diseñado específicamente para eso. ${desire.charAt(0).toUpperCase() + desire.slice(1)}. El cambio que llevas tiempo buscando.`,
      cta: pickRandom(ctas),
    },
    {
      type: 'Prueba Social',
      platform: 'TikTok Ads',
      hook: `+4.200 clientes no pueden estar equivocados.`,
      body: `${product} se ha convertido en el favorito de quienes querían ${desire} sin pagar precios absurdos. Ahora te toca a ti.`,
      cta: pickRandom(ctas),
    },
  ]
}

function buildLongCopies(product: string, niche: typeof DEFAULT_NICHE, objective: string): Array<{
  format: string; platform: string; content: string
}> {
  const pain   = pickRandom(niche.pains)
  const desire = pickRandom(niche.desires)
  const pain2  = pickRandom(niche.pains.filter(p => p !== pain))

  return [
    {
      format: 'Storytelling',
      platform: 'Meta Ads · Feed largo',
      content: `Hace un año, María llevaba meses buscando la solución perfecta.\n\nEstaba harta de ${pain}. Lo había intentado todo — marcas conocidas, opciones más baratas, recomendaciones de amigas. Siempre lo mismo: promesas y decepción.\n\nHasta que encontró ${product}.\n\nEn las primeras dos semanas ya notó la diferencia. No es magia — es que el producto está diseñado de verdad para ${desire}.\n\nHoy María lo recomienda a todo el mundo. Y no es la única.\n\n¿Cuándo vas a darle la oportunidad que mereces?\n\n👇 Haz clic y descúbrelo tú misma.`,
    },
    {
      format: 'Problema–Agitación–Solución',
      platform: 'Meta Ads · Video Copy',
      content: `Si todavía estás lidiando con ${pain}, necesitas leer esto.\n\nEl problema real no es que no hayas encontrado la solución. Es que el mercado está lleno de productos que no están hechos para ti — están hechos para vender.\n\n${pain2.charAt(0).toUpperCase() + pain2.slice(1)}... eso sigue pasando porque nadie ha resuelto el problema de raíz.\n\n${product} lo cambia todo.\n\nNo es otro producto genérico. Es un sistema pensado para que consigas ${desire} de verdad, con resultados que se notan.\n\nLos números hablan: más de 4.000 clientes satisfechos en los últimos 6 meses.\n\n¿Vas a ser el siguiente? 👇`,
    },
  ]
}

function buildHooks(product: string, niche: typeof DEFAULT_NICHE): Array<{
  type: string; text: string; why: string
}> {
  const pain   = pickRandom(niche.pains)
  const desire = pickRandom(niche.desires)

  return [
    {
      type: 'Curiosidad extrema',
      text: `Lo que nadie te cuenta sobre ${product} (y que marca la diferencia)`,
      why: 'Activa el gap de curiosidad. El usuario no puede no querer saber la respuesta.',
    },
    {
      type: 'Dolor directo',
      text: `Si estás harta de ${pain}, este vídeo es para ti.`,
      why: 'Califica al cliente ideal desde el primer segundo. Solo los que tienen el problema hacen clic.',
    },
    {
      type: 'Urgencia + Prueba social',
      text: `4.200 personas ya lo tienen. ¿Por qué tú no?`,
      why: 'FOMO + validación social. Dos triggers de conversión en una sola frase.',
    },
    {
      type: 'Transformación',
      text: `De ${pain} a ${desire} — en menos de lo que crees.`,
      why: 'Muestra el antes y después sin decirlo. El cerebro completa la historia solo.',
    },
    {
      type: 'Patrón de interrupción',
      text: `Para. Deja de buscar más opciones. Ya encontraste la que necesitabas.`,
      why: 'Rompe el scroll con un mensaje directo que interpela al usuario en su momento de decisión.',
    },
  ]
}

function buildCreatives(product: string, niche: typeof DEFAULT_NICHE): Array<{
  format: string; platform: string; duration: string; structure: Array<{ time: string; action: string }>
}> {
  return [
    {
      format: 'UGC — Testimonial espontáneo',
      platform: 'TikTok / Reels',
      duration: '15–20 segundos',
      structure: [
        { time: '0–3s',   action: `Persona mirando a cámara: "Llevaba meses buscando esto..." (cara de sorpresa)` },
        { time: '3–7s',   action: `Primeros planos del producto. Manos mostrando el packaging. Sin narración.` },
        { time: '7–12s',  action: `"Desde que lo uso, ${pickRandom(niche.desires)}. En serio, no lo puedo creer."` },
        { time: '12–15s', action: `CTA directo: "Lo encontré en el link de la bio. Literalmente lo mejor que he comprado."` },
        { time: '15–20s', action: `Texto en pantalla: ${product} + precio + CTA. Música trending de fondo.` },
      ],
    },
    {
      format: 'Before/After — Transformación visual',
      platform: 'TikTok / Reels / Meta Stories',
      duration: '10–15 segundos',
      structure: [
        { time: '0–2s',   action: `Pantalla dividida o transición: estado ANTES (caótico, problema visible)` },
        { time: '2–5s',   action: `Transición con efecto de sonido. Texto: "Después de ${product}..."` },
        { time: '5–10s',  action: `Estado DESPUÉS — resultado deseado claramente visible. Cara de satisfacción.` },
        { time: '10–13s', action: `Zoom al producto. "Disponible solo online — link en la bio."` },
        { time: '13–15s', action: `Logo + precio + botón de compra.` },
      ],
    },
    {
      format: 'Hook agresivo — Educacional',
      platform: 'TikTok Ads / YouTube Pre-roll',
      duration: '20–30 segundos',
      structure: [
        { time: '0–3s',   action: `Hook en texto grande: "El error que comete el 90% de la gente con esto"` },
        { time: '3–8s',   action: `Voz en off rápida explicando el problema. Imágenes del problema en acción.` },
        { time: '8–15s',  action: `"La solución es más simple de lo que crees." Introduce el producto.` },
        { time: '15–22s', action: `Demostración rápida del producto. Resultados visibles. Cifras reales.` },
        { time: '22–28s', action: `CTA fuerte: "Pruébalo 14 días. Si no funciona, te devolvemos el dinero."` },
        { time: '28–30s', action: `Pantalla final con nombre del producto y URL.` },
      ],
    },
  ]
}

function buildCampaignStructure(objective: string): {
  type: string
  funnel: Array<{ stage: string; objective: string; audience: string; budget: string; format: string }>
  totalBudgetSuggestion: string
  notes: string
} {
  const funnelMap = {
    ventas: [
      { stage: 'TOF — Frío',       objective: 'Alcance / Video Views',     audience: 'Intereses fríos + Lookalike 1%',          budget: '30%', format: 'Vídeo UGC 15–20s' },
      { stage: 'MOF — Templado',   objective: 'Tráfico / Interacción',     audience: 'Engagement 30d + Visitantes web',          budget: '25%', format: 'Carrusel + Imagen estática' },
      { stage: 'BOF — Caliente',   objective: 'Conversiones (Compra)',     audience: 'Visitantes sin compra últimos 14d',        budget: '35%', format: 'Imagen 1:1 + copy directo' },
      { stage: 'Retención',        objective: 'Compra repetida / Upsell',  audience: 'Clientes últimos 180d',                    budget: '10%', format: 'Story + Copy personalizado' },
    ],
    leads: [
      { stage: 'TOF — Frío',       objective: 'Alcance / Reconocimiento',  audience: 'Intereses fríos del nicho',                budget: '35%', format: 'Vídeo educacional 20–30s' },
      { stage: 'MOF — Templado',   objective: 'Generación de leads',       audience: 'Engagement 60d + Visitantes web',          budget: '40%', format: 'Lead Ad + landing page' },
      { stage: 'BOF — Caliente',   objective: 'Lead cualificado',          audience: 'Leads sin convertir últimos 30d',          budget: '25%', format: 'Copy largo + prueba social' },
    ],
    trafico: [
      { stage: 'TOF — Frío',       objective: 'Tráfico al sitio web',      audience: 'Intereses amplios del nicho',              budget: '50%', format: 'Imagen + copy de curiosidad' },
      { stage: 'MOF — Templado',   objective: 'Páginas vistas + tiempo',   audience: 'Visitantes rápidos + interacción previa',  budget: '30%', format: 'Vídeo corto + link' },
      { stage: 'BOF — Caliente',   objective: 'Retargeting y conversión',  audience: 'Visitantes de más de 30s últimos 7d',      budget: '20%', format: 'Carrusel + urgencia' },
    ],
  }

  const typeMap: Record<string, string> = {
    ventas:  'Campaña de Conversiones — Evento: Purchase',
    leads:   'Campaña de Generación de Leads — Evento: Lead',
    trafico: 'Campaña de Tráfico — Destino: Sitio web',
  }

  return {
    type: typeMap[objective] ?? typeMap['ventas'],
    funnel: funnelMap[objective as keyof typeof funnelMap] ?? funnelMap['ventas'],
    totalBudgetSuggestion: objective === 'ventas' ? '€30–€80 / día para empezar. Escalar cuando ROAS > 2.5x.' : '€20–€50 / día. Optimizar CPL antes de escalar.',
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
    lookalike: ['Compradores recientes (180d)', 'Visitantes de producto (30d)', 'Clientes de alto valor (LTV top 25%)'],
    exclude: ['Compradores recientes (14d)', 'Empleados propios', 'Competencia directa'],
  }
}

// ─── Insight ─────────────────────────────────────────────────────────────────
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

  const agr: Record<string, string> = {
    agresivo: 'Alto', conversion: 'Alto', tiktok: 'Medio', '': objective === 'ventas' ? 'Medio' : 'Bajo',
  }
  return { angle, clientType: niche.profile, aggressiveness: agr[variant] ?? 'Medio' }
}

// ─── Variant modifiers ────────────────────────────────────────────────────────
function applyVariant(
  copies: ReturnType<typeof buildShortCopies>,
  hooks: ReturnType<typeof buildHooks>,
  variant: string,
  product: string,
  niche: typeof DEFAULT_NICHE,
): { copies: typeof copies; hooks: typeof hooks } {
  if (variant === 'agresivo') {
    return {
      copies: copies.map(c => ({
        ...c,
        hook: c.hook.replace('¿Por qué', 'PARA. ¿Por qué') + ' (Esto te va a cambiar la forma de verlo)',
        body: c.body + ' Sin excusas. El momento es ahora.',
        cta: c.cta.replace('→', ' AHORA →'),
      })),
      hooks: hooks.map(h => ({ ...h, text: h.text + ' — No hay vuelta atrás.' })),
    }
  }
  if (variant === 'conversion') {
    return {
      copies: copies.map(c => ({
        ...c,
        body: c.body + ` Garantía 30 días o te devolvemos el dinero. Sin preguntas.`,
        cta: `⚡ ${c.cta}`,
      })),
      hooks: [
        { type: 'Urgencia real', text: `Quedan pocas unidades de ${product}. Y no es marketing.`, why: 'La escasez real convierte mejor que cualquier descuento.' },
        ...hooks.slice(0, 4),
      ],
    }
  }
  if (variant === 'tiktok') {
    return {
      copies: copies.map(c => ({
        ...c,
        hook: c.hook.length > 60 ? c.hook.split(' ').slice(0, 8).join(' ') + '...' : c.hook,
        body: c.body.split('.')[0] + '. #fyp #viral',
        cta: 'Link en bio 👇',
      })),
      hooks: [
        { type: 'POV', text: `POV: encontraste ${product} antes que nadie en tu feed.`, why: 'El formato POV tiene 3x más retención en TikTok que los hooks directos.' },
        { type: 'Stitch bait', text: `Alguien necesita ver esto. No lo hagas pasar.`, why: 'Incita a guardar y compartir — dos señales clave del algoritmo.' },
        ...hooks.slice(0, 3),
      ],
    }
  }
  return { copies, hooks }
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

  const nicheKey = niche.toLowerCase()
  const nicheData = NICHE_DATA[nicheKey] ?? DEFAULT_NICHE

  // Derive a clean product name from input
  const product = productDescription?.trim()
    ? productDescription.trim().split(' ').slice(0, 6).join(' ')
    : (productUrl?.replace(/https?:\/\//, '').split('/')[0] ?? 'tu producto')

  const rawCopies = buildShortCopies(product, nicheData, objective)
  const rawHooks  = buildHooks(product, nicheData)
  const { copies: finalCopies, hooks: finalHooks } = applyVariant(rawCopies, rawHooks, variant ?? '', product, nicheData)

  const campaign = {
    id: uuid(),
    generatedAt: new Date().toISOString(),
    input: { productDescription, productUrl, niche, objective, campaignStyle, variant },
    insight:           buildInsight(nicheData, objective, campaignStyle ?? '', variant ?? ''),
    shortCopies:       finalCopies,
    longCopies:        buildLongCopies(product, nicheData, objective),
    hooks:             finalHooks,
    creatives:         buildCreatives(product, nicheData),
    campaignStructure: buildCampaignStructure(objective),
    segmentation:      buildSegmentation(nicheData, product),
  }

  res.json({ success: true, data: campaign })
}

// ─── Persistencia en BD ────────────────────────────────────────────────────────

export async function saveCampaign(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId
    const { name, niche, objective, data } = req.body

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

    const campaigns = await prisma.campaign.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, niche: true, objective: true, createdAt: true, data: true }
    })

    res.json({ success: true, data: campaigns })
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
