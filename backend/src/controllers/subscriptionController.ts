import { Request, Response } from 'express'
import { stripe, PRICE_ID, PRICE_IDS, WEBHOOK_SECRET } from '../services/stripeService'
import { UserStore, type SubStatus, prisma } from '../models/User'

const FRONTEND = process.env.FRONTEND_URL ?? 'http://localhost:5173'

// Stripe API versions >= 2025 may omit current_period_end on some event shapes
function tsToISO(ts: number | null | undefined, fallbackDays = 30): string {
  if (ts != null && Number.isFinite(ts) && ts > 0) return new Date(ts * 1000).toISOString()
  return new Date(Date.now() + fallbackDays * 24 * 60 * 60 * 1000).toISOString()
}

// ─── GET /api/subscription/status ────────────────────────────────────────────
export async function getStatus(req: Request, res: Response): Promise<void> {
  const user = await UserStore.findById(req.user!.userId)
  if (!user) { res.status(404).json({ success: false, error: 'Usuario no encontrado.' }); return }
  res.json({ success: true, data: user.subscription ?? null })
}

// ─── POST /api/subscription/checkout ─────────────────────────────────────────
export async function createCheckoutSession(req: Request, res: Response): Promise<void> {
  const user = await UserStore.findById(req.user!.userId)
  if (!user) { res.status(404).json({ success: false, error: 'Usuario no encontrado.' }); return }

  const { priceId: requestedPriceId } = req.body as { priceId?: string }
  const allowedIds = Object.values(PRICE_IDS).filter(Boolean)
  const priceId = (requestedPriceId && allowedIds.includes(requestedPriceId))
    ? requestedPriceId
    : (PRICE_IDS.starter || PRICE_ID)

  if (!priceId || priceId.startsWith('price_REEMPLAZA')) {
    res.status(503).json({ success: false, error: 'Stripe no está configurado en el servidor.' })
    return
  }

  let customerId = user.stripeCustomerId ?? undefined
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email, name: user.name,
      metadata: { agencyos_user_id: user.id },
    })
    customerId = customer.id
    await UserStore.update(user.id, { stripeCustomerId: customerId })
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    mode: 'subscription',
    subscription_data: {
      metadata: { agencyos_user_id: user.id },
    },
    success_url: `${FRONTEND}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:  `${FRONTEND}/subscription/canceled`,
    client_reference_id: user.id,
    allow_promotion_codes: true,
  })

  res.json({ success: true, data: { url: session.url } })
}

// ─── POST /api/subscription/portal ───────────────────────────────────────────
export async function createPortalSession(req: Request, res: Response): Promise<void> {
  const user = await UserStore.findById(req.user!.userId)
  if (!user?.stripeCustomerId) {
    res.status(400).json({ success: false, error: 'No tienes una suscripción activa.' })
    return
  }
  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${FRONTEND}/settings`,
  })
  res.json({ success: true, data: { url: session.url } })
}

// ─── POST /api/subscription/cancel ───────────────────────────────────────────
export async function cancelSubscription(req: Request, res: Response): Promise<void> {
  const user = await UserStore.findById(req.user!.userId)
  if (!user?.subscription?.stripeSubscriptionId) {
    res.status(400).json({ success: false, error: 'No tienes una suscripción activa.' })
    return
  }
  const sub = await stripe.subscriptions.update(
    user.subscription.stripeSubscriptionId,
    { cancel_at_period_end: true },
  )
  await UserStore.update(user.id, {
    subscription: {
      ...user.subscription,
      cancelAtPeriodEnd: true,
      status: sub.status as any,
    },
  })
  res.json({ success: true, data: { cancelAtPeriodEnd: true } })
}

// ─── POST /api/subscription/reactivate ───────────────────────────────────────
export async function reactivateSubscription(req: Request, res: Response): Promise<void> {
  const user = await UserStore.findById(req.user!.userId)
  if (!user?.subscription?.stripeSubscriptionId) {
    res.status(400).json({ success: false, error: 'No tienes una suscripción para reactivar.' })
    return
  }
  await stripe.subscriptions.update(
    user.subscription.stripeSubscriptionId,
    { cancel_at_period_end: false },
  )
  await UserStore.update(user.id, {
    subscription: { ...user.subscription, cancelAtPeriodEnd: false },
  })
  res.json({ success: true, data: { cancelAtPeriodEnd: false } })
}

// ─── POST /api/subscription/webhook ──────────────────────────────────────────
export async function handleWebhook(req: Request, res: Response): Promise<void> {
  const sig = req.headers['stripe-signature'] as string

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let event: any
  try {
    event = stripe.webhooks.constructEvent(req.body as Buffer, sig, WEBHOOK_SECRET)
  } catch (err) {
    console.error('[webhook] Signature verification failed:', err instanceof Error ? err.message : err)
    res.status(400).json({ error: 'Webhook signature invalid.' })
    return
  }

  console.log(`[webhook] Received: ${event.type} — id: ${event.id}`)

  try {
    // Idempotency: skip events already processed (Stripe retries on timeout/error)
    const seen = await prisma.processedWebhookEvent.findUnique({ where: { id: event.id } })
    if (seen) {
      console.log(`[webhook] Duplicate event skipped: ${event.id}`)
      res.json({ received: true })
      return
    }
    await prisma.processedWebhookEvent.create({ data: { id: event.id } })

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        if (session.mode !== 'subscription') break
        const userId = session.client_reference_id ?? ''
        if (!userId) {
          console.error('[webhook] checkout.session.completed: missing client_reference_id', { sessionId: session.id })
          break
        }
        const sub  = await stripe.subscriptions.retrieve(session.subscription) as any
        const item = sub.items.data[0]
        await UserStore.update(userId, {
          stripeCustomerId: session.customer,
          subscription: {
            stripeSubscriptionId: sub.id,
            status:              sub.status as SubStatus,
            currentPeriodEnd:    tsToISO(sub.current_period_end),
            cancelAtPeriodEnd:   sub.cancel_at_period_end ?? false,
            priceId:             item?.price.id ?? PRICE_ID,
            trialEnd:            sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
          },
        })
        console.log(`[webhook] checkout.session.completed: user ${userId} → subscription ${sub.id} (${sub.status})`)
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub  = event.data.object
        let user = await UserStore.findByStripeCustomerId(sub.customer)
        // Fallback: look up user by agencyos_user_id in subscription metadata
        if (!user && sub.metadata?.agencyos_user_id) {
          user = await UserStore.findById(sub.metadata.agencyos_user_id)
          if (user) {
            await UserStore.update(user.id, { stripeCustomerId: sub.customer })
            console.log(`[webhook] ${event.type}: linked customer ${sub.customer} to user ${user.id} via metadata`)
          }
        }
        if (!user) {
          console.error(`[webhook] ${event.type}: no user found for customer ${sub.customer}`)
          break
        }
        const item    = sub.items.data[0]
        const isGone  = event.type === 'customer.subscription.deleted' || sub.status === 'canceled'
        await UserStore.update(user.id, {
          subscription: {
            stripeSubscriptionId: sub.id,
            status:              sub.status as SubStatus,
            currentPeriodEnd:    tsToISO(sub.current_period_end),
            cancelAtPeriodEnd:   sub.cancel_at_period_end ?? false,
            priceId:             item?.price.id ?? PRICE_ID,
            trialEnd:            sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
          },
          // Reset free campaign gate when subscription is truly canceled
          ...(isGone ? { freeUsed: false } : {}),
        })
        console.log(`[webhook] ${event.type}: user ${user.id} → status ${sub.status}${isGone ? ' (freeUsed reset)' : ''}`)
        break
      }

      case 'invoice.payment_action_required': {
        // 3D Secure: mark as past_due so the UI shows an alert
        const invoice = event.data.object
        const user    = await UserStore.findByStripeCustomerId(invoice.customer)
        if (!user?.subscription) {
          console.error('[webhook] invoice.payment_action_required: no user/subscription for customer', invoice.customer)
          break
        }
        await UserStore.update(user.id, {
          subscription: { ...user.subscription, status: 'past_due' },
        })
        console.log(`[webhook] invoice.payment_action_required: user ${user.id} → past_due (3D Secure required)`)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object
        const user    = await UserStore.findByStripeCustomerId(invoice.customer)
        if (!user?.subscription) {
          console.error('[webhook] invoice.payment_failed: no user/subscription for customer', invoice.customer)
          break
        }
        await UserStore.update(user.id, {
          subscription: { ...user.subscription, status: 'past_due' },
        })
        console.log(`[webhook] invoice.payment_failed: user ${user.id} → past_due`)
        break
      }

      default:
        console.log(`[webhook] Unhandled event type: ${event.type}`)
    }
  } catch (err) {
    console.error(`[webhook] Handler error for ${event.type} (id: ${event.id}):`, err)
    // Still respond 200 so Stripe does not retry — log the failure for manual reconciliation
  }

  res.json({ received: true })
}
