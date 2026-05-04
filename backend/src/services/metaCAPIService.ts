import crypto from 'crypto'
import { v4 as uuid } from 'uuid'

const PIXEL_ID = '1312549040971863'
const API_VERSION = 'v21.0'

export interface CAPIUserData {
  email?: string
  name?: string
  ip?: string
  userAgent?: string
  fbc?: string // cookie _fbc
  fbp?: string // cookie _fbp
}

interface CAPIEvent {
  event_name: string
  event_time: number
  event_id: string
  action_source: 'website'
  user_data: Record<string, string>
  custom_data?: Record<string, unknown>
}

function sha256(value: string): string {
  return crypto.createHash('sha256').update(value.toLowerCase().trim()).digest('hex')
}

function buildUserData(user: CAPIUserData): Record<string, string> {
  const data: Record<string, string> = {}
  if (user.email)     data.em = sha256(user.email)
  if (user.name) {
    const parts = user.name.trim().split(/\s+/)
    data.fn = sha256(parts[0])
    if (parts.length > 1) data.ln = sha256(parts.slice(1).join(' '))
  }
  if (user.ip)        data.client_ip_address = user.ip
  if (user.userAgent) data.client_user_agent = user.userAgent
  if (user.fbc)       data.fbc = user.fbc
  if (user.fbp)       data.fbp = user.fbp
  return data
}

async function sendCAPIEvents(events: CAPIEvent[]): Promise<void> {
  const token = process.env.META_CAPI_TOKEN
  if (!token) {
    console.warn('[meta-capi] META_CAPI_TOKEN no configurado — evento omitido')
    return
  }

  const url = `https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events?access_token=${token}`

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: events }),
    })
    const json = await res.json() as { events_received?: number; error?: { message: string; code: number } }
    if (!res.ok || json.error) {
      console.error('[meta-capi] Error de API:', json.error?.message ?? res.statusText)
    } else {
      console.log(`[meta-capi] Eventos enviados correctamente: ${json.events_received}`)
    }
  } catch (err) {
    console.error('[meta-capi] Error de red al enviar eventos:', err)
  }
}

export async function sendCompleteRegistration(user: CAPIUserData): Promise<void> {
  await sendCAPIEvents([{
    event_name:    'CompleteRegistration',
    event_time:    Math.floor(Date.now() / 1000),
    event_id:      uuid(),
    action_source: 'website',
    user_data:     buildUserData(user),
  }])
}

export async function sendPurchase(
  user: CAPIUserData,
  value: number,
  currency = 'EUR',
): Promise<void> {
  await sendCAPIEvents([{
    event_name:    'Purchase',
    event_time:    Math.floor(Date.now() / 1000),
    event_id:      uuid(),
    action_source: 'website',
    user_data:     buildUserData(user),
    custom_data:   { value, currency },
  }])
}

// Forward a raw browser pixel event (for the /api/capi proxy endpoint)
export async function forwardBrowserEvent(
  eventName: string,
  eventId: string | undefined,
  userData: CAPIUserData,
  customData?: Record<string, unknown>,
): Promise<number | undefined> {
  const token = process.env.META_CAPI_TOKEN
  if (!token) {
    console.warn('[meta-capi] META_CAPI_TOKEN no configurado — evento de browser omitido')
    return undefined
  }

  const event: CAPIEvent = {
    event_name:    eventName,
    event_time:    Math.floor(Date.now() / 1000),
    event_id:      eventId ?? uuid(),
    action_source: 'website',
    user_data:     buildUserData(userData),
    ...(customData ? { custom_data: customData } : {}),
  }

  const url = `https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events?access_token=${token}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: [event] }),
  })
  const json = await res.json() as { events_received?: number; error?: { message: string } }
  if (!res.ok || json.error) {
    throw new Error(json.error?.message ?? res.statusText)
  }
  return json.events_received
}
