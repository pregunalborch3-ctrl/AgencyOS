import { Request, Response } from 'express'
import { stripe, PRICE_ID, WEBHOOK_SECRET } from '../services/stripeService'
import { UserStore } from '../models/User'

const FRONTEND = process.env.FRONTEND_URL ?? 'http://localhost:5173'

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

  if (!PRICE_ID || PRICE_ID.startsWith('price_REEMPLAZA')) {
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
    UserStore.update(user.id, { stripeCustomerId: customerId })
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [{ price: PRICE_ID, quantity: 1 }],
    mode: 'subscription',
    subscription_data: {
      trial_period_days: 14,
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
  UserStore.update(user.id, {
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
  UserStore.update(user.id, {
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
  } catch {
    res.status(400).json({ error: 'Webhook signature invalid.' })
    return
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        if (session.mode !== 'subscription') break
        const userId = session.client_reference_id ?? ''
        const sub    = await stripe.subscriptions.retrieve(session.subscription) as any
        const item   = sub.items.data[0]
        UserStore.update(userId, {
          stripeCustomerId: session.customer,
          subscription: {
            stripeSubscriptionId: sub.id,
            status:              sub.status as any,
            currentPeriodEnd:    new Date(sub.current_period_end * 1000).toISOString(),
            cancelAtPeriodEnd:   sub.cancel_at_period_end,
            priceId:             item?.price.id ?? PRICE_ID,
            trialEnd:            sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
          },
        })
        break
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub  = event.data.object
        const user = await UserStore.findByStripeCustomerId(sub.customer)
        if (!user) break
        const item = sub.items.data[0]
        UserStore.update(user.id, {
          subscription: {
            stripeSubscriptionId: sub.id,
            status:              sub.status as any,
            currentPeriodEnd:    new Date(sub.current_period_end * 1000).toISOString(),
            cancelAtPeriodEnd:   sub.cancel_at_period_end,
            priceId:             item?.price.id ?? PRICE_ID,
            trialEnd:            sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
          },
        })
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object
        const user    = await UserStore.findByStripeCustomerId(invoice.customer)
        if (!user?.subscription) break
        UserStore.update(user.id, {
          subscription: { ...user.subscription, status: 'past_due' },
        })
        break
      }
    }
  } catch (err) {
    console.error('Webhook handler error:', err)
  }

  res.json({ received: true })
}
