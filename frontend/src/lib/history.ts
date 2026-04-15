export const HISTORY_KEY = 'agencyos_history'
export const FREE_KEY    = 'agencyos_free_used'

export interface HistoryEntry {
  id:          string
  date:        string
  productName: string
  niche:       string
  objective:   string
  style:       string
  inputText:   string
  result:      unknown
}

export function getHistory(): HistoryEntry[] {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]') }
  catch { return [] }
}

export function saveToHistory(entry: HistoryEntry): void {
  const history = getHistory()
  const updated = [entry, ...history].slice(0, 50)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated))
}

export function hasFreeUsed(): boolean {
  return localStorage.getItem(FREE_KEY) === '1'
}

export function markFreeUsed(): void {
  localStorage.setItem(FREE_KEY, '1')
}
