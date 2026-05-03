import { useSubscription } from '../contexts/SubscriptionContext'
import { useAuth } from '../contexts/AuthContext'

export type PlanTier = 'free' | 'starter' | 'pro' | 'enterprise'

const TIER_ORDER: PlanTier[] = ['free', 'starter', 'pro', 'enterprise']

const PRICE_IDS = {
  starter:    import.meta.env.VITE_STRIPE_PRICE_ID_STARTER    as string | undefined,
  pro:        import.meta.env.VITE_STRIPE_PRICE_ID_PRO        as string | undefined,
  enterprise: import.meta.env.VITE_STRIPE_PRICE_ID_ENTERPRISE as string | undefined,
}

export function usePlan() {
  const { subscription, isLoading } = useSubscription()
  const { user } = useAuth()

  function getTier(): PlanTier {
    if ((user as unknown as Record<string, unknown>)?.role === 'admin') return 'enterprise'
    const priceId = subscription?.priceId
    if (!priceId) return 'free'
    if (priceId === PRICE_IDS.enterprise) return 'enterprise'
    if (priceId === PRICE_IDS.pro)        return 'pro'
    if (priceId === PRICE_IDS.starter)    return 'starter'
    return 'free'
  }

  const tier = getTier()

  function hasAccess(required: PlanTier): boolean {
    return TIER_ORDER.indexOf(tier) >= TIER_ORDER.indexOf(required)
  }

  return { tier, hasAccess, isLoading }
}
