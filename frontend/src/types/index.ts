// ─── Content Generator ────────────────────────────────────────────────────────
export type Platform = 'instagram' | 'facebook' | 'twitter' | 'linkedin' | 'tiktok' | 'youtube'
export type ContentTone = 'profesional' | 'casual' | 'humorístico' | 'inspiracional' | 'urgente' | 'educativo'
export type ContentType = 'post' | 'story' | 'reel' | 'carrusel' | 'artículo' | 'anuncio'

export interface ContentRequest {
  platform: Platform
  tone: ContentTone
  contentType: ContentType
  topic: string
  brand: string
  keywords: string
  callToAction?: string
}

export interface GeneratedContent {
  id: string
  caption: string
  hashtags: string[]
  platform: Platform
  createdAt: string
}

// ─── Publication Calendar ─────────────────────────────────────────────────────
export type PostStatus = 'borrador' | 'programado' | 'publicado' | 'pausado'

export interface CalendarPost {
  id: string
  title: string
  content: string
  platform: Platform
  status: PostStatus
  scheduledAt: string
  tags: string[]
  color?: string
}

// ─── Budget Calculator ────────────────────────────────────────────────────────
export type BudgetCategory =
  | 'Estrategia'
  | 'Creatividad'
  | 'Producción'
  | 'Medios'
  | 'Influencers'
  | 'Tecnología'
  | 'Gestión'
  | 'Otro'

export interface BudgetLineItem {
  id: string
  description: string
  category: BudgetCategory
  quantity: number
  unitPrice: number
  total: number
}

export interface Budget {
  id: string
  projectName: string
  client: string
  currency: string
  items: BudgetLineItem[]
  agencyFeePercent: number
  taxPercent: number
  notes: string
  createdAt: string
}

// ─── Briefing Template ────────────────────────────────────────────────────────
export type ProjectType = 'campaña' | 'branding' | 'social media' | 'evento' | 'digital' | 'producción' | 'otro'

export interface BriefingForm {
  id: string
  clientName: string
  brand: string
  projectName: string
  projectType: ProjectType
  objective: string
  targetAudience: string
  ageRange: string
  location: string
  keyMessage: string
  tone: string
  mandatories: string
  restrictions: string
  deliverables: string
  startDate: string
  endDate: string
  budget: string
  competitors: string
  references: string
  additionalNotes: string
  createdAt: string
}

// ─── Competitor Analyzer ─────────────────────────────────────────────────────
export interface SocialMetrics {
  platform: Platform
  followers: number
  engagementRate: number
  postsPerWeek: number
  avgLikes: number
  avgComments: number
}

export interface Competitor {
  id: string
  name: string
  website: string
  description: string
  metrics: SocialMetrics[]
  strengths: string[]
  weaknesses: string[]
  opportunities: string[]
  createdAt: string
}

// ─── Navigation ───────────────────────────────────────────────────────────────
export interface NavItem {
  id: string
  label: string
  path: string
  icon: string
}

// ─── API Response ─────────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}
