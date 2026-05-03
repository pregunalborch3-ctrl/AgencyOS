import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────
export interface AuthUser {
  id: string
  name: string
  email: string
  role: string
  createdAt: string
  lastLoginAt: string | null
  onboardingDone: boolean
}

export interface OnboardingSettings {
  agencyName?: string
  clientType?: string
  primaryGoal?: string
}

interface AuthState {
  user: AuthUser | null
  token: string | null
  isLoading: boolean
}

interface AuthContextType extends AuthState {
  login:               (email: string, password: string) => Promise<void>
  register:            (name: string, email: string, password: string, confirmPassword: string) => Promise<void>
  logout:              () => void
  markOnboardingDone:  (settings?: OnboardingSettings) => Promise<void>
}

// ─── Context ──────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextType | null>(null)

const TOKEN_KEY = 'agencyos_token'

function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

function storeToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(TOKEN_KEY)
}

async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit,
  token?: string | null,
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`/api${endpoint}`, { ...options, headers })

  const contentType = res.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) {
    throw new Error(`Error del servidor (${res.status}). Por favor inténtalo de nuevo.`)
  }

  const data = await res.json()
  if (!res.ok || !data.success) throw new Error(data.error ?? 'Error desconocido')
  return data.data as T
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: getStoredToken(),
    isLoading: true,
  })

  // On mount: validate stored token
  useEffect(() => {
    const token = getStoredToken()
    if (!token) {
      setState({ user: null, token: null, isLoading: false })
      return
    }
    apiFetch<AuthUser>('/auth/me', undefined, token)
      .then(user => setState({ user, token, isLoading: false }))
      .catch(() => {
        clearToken()
        setState({ user: null, token: null, isLoading: false })
      })
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const { token, user } = await apiFetch<{ token: string; user: AuthUser }>(
      '/auth/login',
      { method: 'POST', body: JSON.stringify({ email, password }) },
    )
    storeToken(token)
    setState({ user, token, isLoading: false })
  }, [])

  const register = useCallback(
    async (name: string, email: string, password: string, confirmPassword: string) => {
      const { token, user } = await apiFetch<{ token: string; user: AuthUser }>(
        '/auth/register',
        { method: 'POST', body: JSON.stringify({ name, email, password, confirmPassword }) },
      )
      storeToken(token)
      setState({ user, token, isLoading: false })
    },
    [],
  )

  const logout = useCallback(() => {
    clearToken()
    setState({ user: null, token: null, isLoading: false })
  }, [])

  const markOnboardingDone = useCallback(async (settings?: OnboardingSettings) => {
    const storedToken = getStoredToken()
    if (!storedToken) return
    setState(prev => prev.user ? { ...prev, user: { ...prev.user, onboardingDone: true } } : prev)
    apiFetch('/auth/onboarding-done', { method: 'POST', body: JSON.stringify(settings ?? {}) }, storedToken)
      .catch((err: unknown) => {
        console.error('[markOnboardingDone] Error al sincronizar con el servidor:', err)
      })
  }, [])

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, markOnboardingDone }}>
      {children}
    </AuthContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
