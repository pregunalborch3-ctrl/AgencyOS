import { Router, type Request, type Response } from 'express'
import { forwardBrowserEvent } from '../services/metaCAPIService'

const router = Router()

const PIXEL_ID = '1312549040971863'

// GET /api/capi/capig/autoconfig
// Meta hace una petición GET a este endpoint para verificar y autoconfigurar
// la conexión con la puerta de enlace CAPI (CAPIG). Devuelve el estado y
// la configuración del gateway para que Meta la detecte automáticamente.
router.get('/capig/autoconfig', (req: Request, res: Response): void => {
  const host    = req.headers['x-forwarded-host'] ?? req.headers.host ?? ''
  const proto   = req.headers['x-forwarded-proto'] ?? (req.secure ? 'https' : 'http')
  const baseUrl = `${proto}://${host}`

  res.json({
    status:  'success',
    version: '1.0.0',
    endpoint: `${baseUrl}/api/capi`,
    pixel_settings: [
      {
        pixel_id:    PIXEL_ID,
        endpoint:    `${baseUrl}/api/capi`,
        access_mode: 'server_side',
      },
    ],
  })
})

// POST /api/capi
// El frontend envía aquí los eventos del Pixel de Meta para que el servidor
// los reenvíe a la CAPI de Meta. Esto mejora la calidad de señal y evita
// que los bloqueadores de anuncios intercepten los eventos del navegador.
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { event_name, event_id, user_data, custom_data } = req.body as {
      event_name?: string
      event_id?: string
      user_data?: Record<string, string>
      custom_data?: Record<string, unknown>
    }

    if (!event_name) {
      res.status(400).json({ success: false, error: 'event_name es obligatorio.' })
      return
    }

    const ip = (req.headers['x-forwarded-for'] as string | undefined)
      ?.split(',')[0]?.trim() ?? req.ip ?? ''
    const userAgent = req.headers['user-agent'] ?? ''

    const received = await forwardBrowserEvent(
      event_name,
      event_id,
      {
        ...user_data,
        ip,
        userAgent,
      },
      custom_data,
    )

    res.json({ success: true, data: { events_received: received } })
  } catch (err) {
    console.error('[capi] Error al reenviar evento a Meta:', err)
    res.status(502).json({ success: false, error: 'Error al enviar evento a Meta.' })
  }
})

export default router
