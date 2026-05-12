import { prisma } from '../models/User'
import { sendActivationEmail } from './emailService'

const DAY = 24 * 60 * 60 * 1000

export async function sendActivationEmails(): Promise<void> {
  try {
    const oneDayAgo = new Date(Date.now() - DAY)

    // Usuarios registrados hace más de 24h, sin email de activación enviado,
    // sin suscripción activa, y con 0 campañas
    const candidates = await prisma.user.findMany({
      where: {
        createdAt:             { lt: oneDayAgo },
        activationEmailSentAt: null,
        // Excluir emails de test
        email: {
          not: { endsWith: '@example.com' },
        },
      },
      select: {
        id:        true,
        name:      true,
        email:     true,
        _count:    { select: { campaigns: true } },
      },
    })

    // Filtrar solo los que tienen 0 campañas
    const inactive = candidates.filter(u => u._count.campaigns === 0)

    let sent = 0
    for (const user of inactive) {
      try {
        await sendActivationEmail(user.email, user.name)
        await prisma.user.update({
          where: { id: user.id },
          data:  { activationEmailSentAt: new Date() },
        })
        sent++
        console.log(`[activation-email] Enviado a ${user.email}`)
      } catch (err) {
        console.error(`[activation-email] Error para ${user.email}:`, err)
      }
    }

    if (sent > 0) console.log(`[activation-email] Total enviados: ${sent}`)
    else console.log('[activation-email] Sin usuarios nuevos inactivos')
  } catch (err) {
    console.error('[activation-email] Error en scheduler:', err)
  }
}
