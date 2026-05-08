import { prisma } from "../models/User"
import {
  sendTrialDay2Email,
  sendTrialDay4Email,
  sendTrialDay6Email,
  sendTrialEndEmail,
} from "./emailService"

const DAY = 24 * 60 * 60 * 1000

export async function sendTrialEmails(): Promise<void> {
  try {
    const trialing = await prisma.user.findMany({
      where: { subscriptionStatus: "trialing" },
      select: { email: true, name: true, createdAt: true },
    })

    let sent = 0

    for (const user of trialing) {
      const ageDays = (Date.now() - user.createdAt.getTime()) / DAY

      try {
        if (ageDays >= 2 && ageDays < 3) {
          await sendTrialDay2Email(user.email, user.name)
          sent++
        } else if (ageDays >= 4 && ageDays < 5) {
          await sendTrialDay4Email(user.email, user.name)
          sent++
        } else if (ageDays >= 6 && ageDays < 7) {
          await sendTrialDay6Email(user.email, user.name)
          sent++
        } else if (ageDays >= 7 && ageDays < 8) {
          await sendTrialEndEmail(user.email, user.name)
          sent++
        }
      } catch (err) {
        console.error(`[trial-email] Error para ${user.email}:`, err)
      }
    }

    if (sent > 0) console.log(`[trial-email] Emails de trial enviados: ${sent}`)
  } catch (err) {
    console.error("[trial-email] Error en scheduler:", err)
  }
}
