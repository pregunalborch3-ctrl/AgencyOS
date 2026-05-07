import { useCallback, useRef, useSyncExternalStore } from 'react'

type Listener = () => void

const store     = new Map<string, unknown>()
const listeners = new Map<string, Set<Listener>>()

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

export function getPersisted<T>(key: string): T | undefined {
  return store.get(key) as T | undefined
}

export function setPersisted<T>(key: string, value: T): void {
  store.set(key, value)
  emit(key)
}

export function clearPersisted(key: string): void {
  if (store.delete(key)) emit(key)
}

/**
 * useState-compatible hook backed by an in-memory module-level store.
 * State survives unmount/remount (e.g. navigating away and back) for the
 * lifetime of the page (until full reload).
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
    () => (store.has(key) ? (store.get(key) as T) : (initialRef.current as T)),
    () => initialRef.current as T,
  )

  const setValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      const cur = store.has(key) ? (store.get(key) as T) : (initialRef.current as T)
      const resolved = typeof next === 'function' ? (next as (p: T) => T)(cur) : next
      setPersisted(key, resolved)
    },
    [key],
  )

  return [value, setValue]
}
