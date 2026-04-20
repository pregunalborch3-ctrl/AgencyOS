const BASE = '/api'

export interface SavedCampaign {
  id:        string
  name:      string
  niche:     string
  objective: string
  createdAt: string
  data:      unknown
}

async function authFetch<T>(endpoint: string, token: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${endpoint}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  })
  const json = await res.json()
  if (!res.ok || !json.success) throw new Error(json.error ?? 'Error desconocido')
  return json.data as T
}

export function saveCampaign(
  token: string,
  payload: { name: string; niche: string; objective: string; data: unknown },
) {
  return authFetch<SavedCampaign>('/campaigns', token, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function getCampaigns(token: string) {
  return authFetch<SavedCampaign[]>('/campaigns', token)
}

export function deleteCampaignById(token: string, id: string) {
  return authFetch<{ id: string }>(`/campaigns/${id}`, token, { method: 'DELETE' })
}
