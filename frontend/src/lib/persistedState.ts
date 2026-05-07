import { useCallback, useRef, useSyncExternalStore } from 'react'

type Listener = () => void

const STORAGE_PREFIX = 'agencyos.persist.'

const listeners   = new Map<string, Set<Listener>>()
// In-memory cache of parsed values. Used so that getSnapshot returns a
// referentially stable value across renders (required by useSyncExternalStore)
// and so that non-serializable values (e.g. File) keep working in-memory
// even though sessionStorage cannot hold them.
const memoryCache = new Map<string, unknown>()

function emit(key: string): void {
  const set = listeners.get(key)
  if (set) for (const l of set) l()
}

function subscribe(key: string, l: Listener): () => void {
  let set = listeners.get(key)
  if (!set) { set = new Set(); listeners.set(key, set) }
  set.add(l)
  return () => {
    const s = listeners.get(key)
    if (!s) return
    s.delete(l)
    if (s.size === 0) listeners.delete(key)
  }
}

function readValue<T>(key: string): T | undefined {
  if (memoryCache.has(key)) return memoryCache.get(key) as T
  if (typeof window === 'undefined') return undefined
  try {
    const raw = window.sessionStorage.getItem(STORAGE_PREFIX + key)
    if (raw == null) return undefined
    const parsed = JSON.parse(raw) as T
    memoryCache.set(key, parsed)
    return parsed
  } catch {
    return undefined
  }
}

function writeValue<T>(key: string, value: T): void {
  memoryCache.set(key, value)
  if (typeof window !== 'undefined') {
    try {
      window.sessionStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value))
    } catch {
      // Non-serializable (File, circular ref, quota exceeded). Keep in
      // memory so the in-tab UX still works for the current navigation.
    }
  }
  emit(key)
}

export function getPersisted<T>(key: string): T | undefined {
  return readValue<T>(key)
}

export function setPersisted<T>(key: string, value: T): void {
  writeValue(key, value)
}

export function clearPersisted(key: string): void {
  memoryCache.delete(key)
  if (typeof window !== 'undefined') {
    try { window.sessionStorage.removeItem(STORAGE_PREFIX + key) } catch { /* noop */ }
  }
  emit(key)
}

/**
 * useState-compatible hook whose value persists across unmount/remount
 * within a browser tab (sessionStorage). Survives navigation between
 * pages but resets on tab close or full reload of a different origin.
 */
export function usePersistedState<T>(
  key: string,
  initial: T | (() => T),
): [T, (value: T | ((prev: T) => T)) => void] {
  const initialRef = useRef<T>()
  if (initialRef.current === undefined) {
    initialRef.current = typeof initial === 'function' ? (initial as () => T)() : initial
  }

  const value = useSyncExternalStore(
    cb => subscribe(key, cb),
    () => {
      const cur = readValue<T>(key)
      return cur !== undefined ? cur : (initialRef.current as T)
    },
    () => initialRef.current as T,
  )

  const setValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      const cur  = readValue<T>(key)
      const prev = cur !== undefined ? cur : (initialRef.current as T)
      const resolved = typeof next === 'function' ? (next as (p: T) => T)(prev) : next
      writeValue(key, resolved)
    },
    [key],
  )

  return [value, setValue]
}
