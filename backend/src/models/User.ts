// ─── Subscription ─────────────────────────────────────────────────────────────
export type SubStatus =
  | 'active' | 'trialing' | 'canceled' | 'past_due'
  | 'incomplete' | 'incomplete_expired' | 'unpaid' | 'paused'

export interface SubscriptionData {
  stripeSubscriptionId: string
  status: SubStatus
  currentPeriodEnd: string      // ISO string
  cancelAtPeriodEnd: boolean
  priceId: string
  trialEnd: string | null
}

// ─── User ─────────────────────────────────────────────────────────────────────
export interface User {
  id: string
  name: string
  email: string
  passwordHash: string
  role: 'admin' | 'member'
  createdAt: string
  lastLoginAt: string | null
  // Stripe
  stripeCustomerId: string | null
  subscription: SubscriptionData | null
}

export type PublicUser = Omit<User, 'passwordHash'>

// ─── In-memory store ──────────────────────────────────────────────────────────
// Production: replace with Prisma / TypeORM / Mongoose adapter
const store      = new Map<string, User>()
const emailIndex = new Map<string, string>()           // email → id
const stripeIndex = new Map<string, string>()          // stripeCustomerId → id

export const UserStore = {
  create(user: User): User {
    store.set(user.id, user)
    emailIndex.set(user.email.toLowerCase(), user.id)
    if (user.stripeCustomerId) stripeIndex.set(user.stripeCustomerId, user.id)
    return user
  },

  findById(id: string): User | undefined {
    return store.get(id)
  },

  findByEmail(email: string): User | undefined {
    const id = emailIndex.get(email.toLowerCase())
    return id ? store.get(id) : undefined
  },

  findByStripeCustomerId(customerId: string): User | undefined {
    const id = stripeIndex.get(customerId)
    return id ? store.get(id) : undefined
  },

  update(id: string, patch: Partial<User>): User | undefined {
    const user = store.get(id)
    if (!user) return undefined
    const updated = { ...user, ...patch, id }
    store.set(id, updated)
    if (patch.stripeCustomerId) stripeIndex.set(patch.stripeCustomerId, id)
    return updated
  },

  toPublic(user: User): PublicUser {
    const { passwordHash: _pw, ...pub } = user
    return pub
  },
}
