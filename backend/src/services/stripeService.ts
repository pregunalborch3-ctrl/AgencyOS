import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.startsWith('sk_test_REEMPLAZA')) {
  console.warn('\n⚠  STRIPE_SECRET_KEY no configurada. Las rutas de suscripción no funcionarán.\n')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? 'sk_test_placeholder')

export const PRICE_ID = process.env.STRIPE_PRICE_ID ?? ''
export const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? ''
