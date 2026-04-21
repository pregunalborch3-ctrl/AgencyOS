import { PrismaClient } from "@prisma/client"

export const prisma = new PrismaClient()

export type SubStatus = "active" | "trialing" | "canceled" | "past_due" | "incomplete" | "incomplete_expired" | "unpaid" | "paused"

export interface SubscriptionData {
  stripeSubscriptionId: string
  status: SubStatus
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
  priceId: string
  trialEnd: string | null
}

export interface User {
  id: string
  name: string
  email: string
  passwordHash: string
  role: "admin" | "member"
  createdAt: string
  lastLoginAt: string | null
  stripeCustomerId: string | null
  subscription: SubscriptionData | null
  freeUsed: boolean
}

export type PublicUser = Omit<User, "passwordHash">

function toUser(u: any): User {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    passwordHash: u.passwordHash,
    role: u.role as "admin" | "member",
    createdAt: u.createdAt.toISOString(),
    lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
    stripeCustomerId: u.stripeCustomerId,
    subscription: u.subscriptionId ? {
      stripeSubscriptionId: u.subscriptionId,
      status: u.subscriptionStatus as SubStatus,
      currentPeriodEnd: u.subscriptionEnd ? u.subscriptionEnd.toISOString() : "",
      cancelAtPeriodEnd: u.cancelAtPeriodEnd,
      priceId: u.priceId ?? "",
      trialEnd: u.trialEnd ? u.trialEnd.toISOString() : null,
    } : null,
    freeUsed: u.freeUsed ?? false,
  }
}

export const UserStore = {
  async create(user: Omit<User, "createdAt" | "lastLoginAt"> & { createdAt?: string }): Promise<User> {
    const u = await prisma.user.create({
      data: {
        id: user.id,
        name: user.name,
        email: user.email.toLowerCase(),
        passwordHash: user.passwordHash,
        role: user.role,
      }
    })
    return toUser(u)
  },

  async findById(id: string): Promise<User | undefined> {
    const u = await prisma.user.findUnique({ where: { id } })
    return u ? toUser(u) : undefined
  },

  async findByEmail(email: string): Promise<User | undefined> {
    const u = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
    return u ? toUser(u) : undefined
  },

  async findByStripeCustomerId(customerId: string): Promise<User | undefined> {
    const u = await prisma.user.findFirst({ where: { stripeCustomerId: customerId } })
    return u ? toUser(u) : undefined
  },

  async update(id: string, data: Partial<any>): Promise<User> {
    const updateData: any = {}
    if (data.lastLoginAt !== undefined) updateData.lastLoginAt = data.lastLoginAt ? new Date(data.lastLoginAt) : null
    if (data.stripeCustomerId !== undefined) updateData.stripeCustomerId = data.stripeCustomerId
    if (data.subscriptionId !== undefined) updateData.subscriptionId = data.subscriptionId
    if (data.subscriptionStatus !== undefined) updateData.subscriptionStatus = data.subscriptionStatus
    if (data.subscriptionEnd !== undefined) updateData.subscriptionEnd = data.subscriptionEnd ? new Date(data.subscriptionEnd) : null
    if (data.trialEnd !== undefined) updateData.trialEnd = data.trialEnd ? new Date(data.trialEnd) : null
    if (data.priceId !== undefined) updateData.priceId = data.priceId
    if (data.cancelAtPeriodEnd !== undefined) updateData.cancelAtPeriodEnd = data.cancelAtPeriodEnd
    if (data.freeUsed !== undefined) updateData.freeUsed = data.freeUsed
    if (data.subscription !== undefined) {
      const sub = data.subscription
      if (sub) {
        updateData.subscriptionId = sub.stripeSubscriptionId
        updateData.subscriptionStatus = sub.status
        updateData.subscriptionEnd = sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd) : null
        updateData.cancelAtPeriodEnd = sub.cancelAtPeriodEnd
        updateData.priceId = sub.priceId
        updateData.trialEnd = sub.trialEnd ? new Date(sub.trialEnd) : null
      } else {
        updateData.subscriptionId = null
        updateData.subscriptionStatus = null
        updateData.subscriptionEnd = null
        updateData.cancelAtPeriodEnd = false
        updateData.priceId = null
        updateData.trialEnd = null
      }
    }
    const u = await prisma.user.update({ where: { id }, data: updateData })
    return toUser(u)
  },

  toPublic(user: User): PublicUser {
    const { passwordHash, ...pub } = user
    return pub
  }
}
