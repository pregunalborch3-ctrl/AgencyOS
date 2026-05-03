export type PlanTier = 'free' | 'starter' | 'pro' | 'enterprise'

const TIER_ORDER: PlanTier[] = ['free', 'starter', 'pro', 'enterprise']

export function getPlanTier(priceId: string | null | undefined): PlanTier {
  if (!priceId) return 'free'
  if (priceId === process.env.STRIPE_PRICE_ID_ENTERPRISE) return 'enterprise'
  if (priceId === process.env.STRIPE_PRICE_ID_PRO)        return 'pro'
  if (priceId === process.env.STRIPE_PRICE_ID_STARTER)    return 'starter'
  return 'free'
}

export function hasAccess(userTier: PlanTier, required: PlanTier): boolean {
  return TIER_ORDER.indexOf(userTier) >= TIER_ORDER.indexOf(required)
}
