"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStatus = getStatus;
exports.createCheckoutSession = createCheckoutSession;
exports.createPortalSession = createPortalSession;
exports.cancelSubscription = cancelSubscription;
exports.reactivateSubscription = reactivateSubscription;
exports.handleWebhook = handleWebhook;
const stripeService_1 = require("../services/stripeService");
const User_1 = require("../models/User");
const FRONTEND = process.env.FRONTEND_URL ?? 'http://localhost:5173';
// ─── GET /api/subscription/status ────────────────────────────────────────────
async function getStatus(req, res) {
    const user = await User_1.UserStore.findById(req.user.userId);
    if (!user) {
        res.status(404).json({ success: false, error: 'Usuario no encontrado.' });
        return;
    }
    res.json({ success: true, data: user.subscription ?? null });
}
// ─── POST /api/subscription/checkout ─────────────────────────────────────────
async function createCheckoutSession(req, res) {
    const user = await User_1.UserStore.findById(req.user.userId);
    if (!user) {
        res.status(404).json({ success: false, error: 'Usuario no encontrado.' });
        return;
    }
    const { priceId: requestedPriceId } = req.body;
    const allowedIds = Object.values(stripeService_1.PRICE_IDS).filter(Boolean);
    const priceId = (requestedPriceId && allowedIds.includes(requestedPriceId))
        ? requestedPriceId
        : (stripeService_1.PRICE_IDS.starter || stripeService_1.PRICE_ID);
    if (!priceId || priceId.startsWith('price_REEMPLAZA')) {
        res.status(503).json({ success: false, error: 'Stripe no está configurado en el servidor.' });
        return;
    }
    let customerId = user.stripeCustomerId ?? undefined;
    if (!customerId) {
        const customer = await stripeService_1.stripe.customers.create({
            email: user.email, name: user.name,
            metadata: { agencyos_user_id: user.id },
        });
        customerId = customer.id;
        User_1.UserStore.update(user.id, { stripeCustomerId: customerId });
    }
    const session = await stripeService_1.stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        mode: 'subscription',
        subscription_data: {
            trial_period_days: 14,
            metadata: { agencyos_user_id: user.id },
        },
        success_url: `${FRONTEND}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${FRONTEND}/subscription/canceled`,
        client_reference_id: user.id,
        allow_promotion_codes: true,
    });
    res.json({ success: true, data: { url: session.url } });
}
// ─── POST /api/subscription/portal ───────────────────────────────────────────
async function createPortalSession(req, res) {
    const user = await User_1.UserStore.findById(req.user.userId);
    if (!user?.stripeCustomerId) {
        res.status(400).json({ success: false, error: 'No tienes una suscripción activa.' });
        return;
    }
    const session = await stripeService_1.stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: `${FRONTEND}/settings`,
    });
    res.json({ success: true, data: { url: session.url } });
}
// ─── POST /api/subscription/cancel ───────────────────────────────────────────
async function cancelSubscription(req, res) {
    const user = await User_1.UserStore.findById(req.user.userId);
    if (!user?.subscription?.stripeSubscriptionId) {
        res.status(400).json({ success: false, error: 'No tienes una suscripción activa.' });
        return;
    }
    const sub = await stripeService_1.stripe.subscriptions.update(user.subscription.stripeSubscriptionId, { cancel_at_period_end: true });
    User_1.UserStore.update(user.id, {
        subscription: {
            ...user.subscription,
            cancelAtPeriodEnd: true,
            status: sub.status,
        },
    });
    res.json({ success: true, data: { cancelAtPeriodEnd: true } });
}
// ─── POST /api/subscription/reactivate ───────────────────────────────────────
async function reactivateSubscription(req, res) {
    const user = await User_1.UserStore.findById(req.user.userId);
    if (!user?.subscription?.stripeSubscriptionId) {
        res.status(400).json({ success: false, error: 'No tienes una suscripción para reactivar.' });
        return;
    }
    await stripeService_1.stripe.subscriptions.update(user.subscription.stripeSubscriptionId, { cancel_at_period_end: false });
    User_1.UserStore.update(user.id, {
        subscription: { ...user.subscription, cancelAtPeriodEnd: false },
    });
    res.json({ success: true, data: { cancelAtPeriodEnd: false } });
}
// ─── POST /api/subscription/webhook ──────────────────────────────────────────
async function handleWebhook(req, res) {
    const sig = req.headers['stripe-signature'];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let event;
    try {
        event = stripeService_1.stripe.webhooks.constructEvent(req.body, sig, stripeService_1.WEBHOOK_SECRET);
    }
    catch (err) {
        console.error('[webhook] Signature verification failed:', err instanceof Error ? err.message : err);
        res.status(400).json({ error: 'Webhook signature invalid.' });
        return;
    }
    console.log(`[webhook] Received: ${event.type} — id: ${event.id}`);
    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;
                if (session.mode !== 'subscription')
                    break;
                const userId = session.client_reference_id ?? '';
                if (!userId) {
                    console.error('[webhook] checkout.session.completed: missing client_reference_id', { sessionId: session.id });
                    break;
                }
                const sub = await stripeService_1.stripe.subscriptions.retrieve(session.subscription);
                const item = sub.items.data[0];
                await User_1.UserStore.update(userId, {
                    stripeCustomerId: session.customer,
                    subscription: {
                        stripeSubscriptionId: sub.id,
                        status: sub.status,
                        currentPeriodEnd: new Date(sub.current_period_end * 1000).toISOString(),
                        cancelAtPeriodEnd: sub.cancel_at_period_end,
                        priceId: item?.price.id ?? stripeService_1.PRICE_ID,
                        trialEnd: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
                    },
                });
                console.log(`[webhook] checkout.session.completed: user ${userId} → subscription ${sub.id} (${sub.status})`);
                break;
            }
            case 'customer.subscription.updated':
            case 'customer.subscription.deleted': {
                const sub = event.data.object;
                const user = await User_1.UserStore.findByStripeCustomerId(sub.customer);
                if (!user) {
                    console.error(`[webhook] ${event.type}: no user found for customer ${sub.customer}`);
                    break;
                }
                const item = sub.items.data[0];
                const isGone = event.type === 'customer.subscription.deleted' || sub.status === 'canceled';
                await User_1.UserStore.update(user.id, {
                    subscription: {
                        stripeSubscriptionId: sub.id,
                        status: sub.status,
                        currentPeriodEnd: new Date(sub.current_period_end * 1000).toISOString(),
                        cancelAtPeriodEnd: sub.cancel_at_period_end,
                        priceId: item?.price.id ?? stripeService_1.PRICE_ID,
                        trialEnd: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
                    },
                    // Reset free campaign gate when subscription is truly canceled
                    ...(isGone ? { freeUsed: false } : {}),
                });
                console.log(`[webhook] ${event.type}: user ${user.id} → status ${sub.status}${isGone ? ' (freeUsed reset)' : ''}`);
                break;
            }
            case 'invoice.payment_failed': {
                const invoice = event.data.object;
                const user = await User_1.UserStore.findByStripeCustomerId(invoice.customer);
                if (!user?.subscription) {
                    console.error('[webhook] invoice.payment_failed: no user/subscription for customer', invoice.customer);
                    break;
                }
                await User_1.UserStore.update(user.id, {
                    subscription: { ...user.subscription, status: 'past_due' },
                });
                console.log(`[webhook] invoice.payment_failed: user ${user.id} → past_due`);
                break;
            }
            default:
                console.log(`[webhook] Unhandled event type: ${event.type}`);
        }
    }
    catch (err) {
        console.error(`[webhook] Handler error for ${event.type} (id: ${event.id}):`, err);
        // Still respond 200 so Stripe does not retry — log the failure for manual reconciliation
    }
    res.json({ received: true });
}
