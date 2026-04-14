import {
  createContext, useContext, useState, useEffect, useCallback,
  type ReactNode,
} from 'react'
import { useAuth } from './AuthContext'

const TOKEN_KEY = 'agencyos_token'

// ─── Types ────────────────────────────────────────────────────────────────────
export type SubStatus =
  | 'active' | 'trialing' | 'canceled' | 'past_due'
  | 'incomplete' | 'incomplete_expired' | 'unpaid' | 'paused'

export interface SubscriptionData {
  stripeSubscriptionId: string
  status: SubStatus
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
  priceId: string
  trialEnd: string | null
}

interface SubContextType {
  subscription: SubscriptionData | null
  isLoading:    boolean
  isActive:     boolean   // active or trialing
  refetch:      () => Promise<void>
  subscribe:    () => Promise<void>
  openPortal:   () => Promise<void>
  cancel:       () => Promise<void>
  reactivate:   () => Promise<void>
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const SubContext = createContext<SubContextType | null>(null)

function token() { return localStorage.getItem(TOKEN_KEY) }

async function authFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res  = await fetch(`/api${endpoint}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
  })
  const data = await res.json()
  if (!res.ok || !data.success) throw new Error(data.error ?? 'Error')
  return data.data as T
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [isLoading,    setIsLoading]    = useState(true)

  const refetch = useCallback(async () => {
    if (!user) { setSubscription(null); setIsLoading(false); return }
    try {
      const data = await authFetch<SubscriptionData | null>('/subscription/status')
      setSubscription(data)
    } catch {
      setSubscription(null)
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => { setIsLoading(true); refetch() }, [refetch])

  const subscribe = useCallback(async () => {
    const { url } = await authFetch<{ url: string }>('/subscription/checkout', { method: 'POST' })
    window.location.href = url
  }, [])

  const openPortal = useCallback(async () => {
    const { url } = await authFetch<{ url: string }>('/subscription/portal', { method: 'POST' })
    window.location.href = url
  }, [])

  const cancel = useCallback(async () => {
    await authFetch('/subscription/cancel', { method: 'POST' })
    await refetch()
  }, [refetch])

  const reactivate = useCallback(async () => {
    await authFetch('/subscription/reactivate', { method: 'POST' })
    await refetch()
  }, [refetch])

  const isActive = subscription?.status === 'active' || subscription?.status === 'trialing'

  return (
    <SubContext.Provider value={{ subscription, isLoading, isActive, refetch, subscribe, openPortal, cancel, reactivate }}>
      {children}
    </SubContext.Provider>
  )
}

export function useSubscription(): SubContextType {
  const ctx = useContext(SubContext)
  if (!ctx) throw new Error('useSubscription must be used inside SubscriptionProvider')
  return ctx
}
