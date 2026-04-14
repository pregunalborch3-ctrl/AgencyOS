import { Request, Response } from 'express'
import { v4 as uuid } from 'uuid'
import type { CalendarPost } from '../types'

const posts: CalendarPost[] = [
  {
    id: uuid(),
    title: 'Lanzamiento campaña verano',
    content: '¡El verano llegó! Descubre nuestra nueva colección...',
    platform: 'instagram',
    status: 'programado',
    scheduledAt: new Date(2026, 3, 15, 10, 0).toISOString(),
    tags: ['verano', 'colección'],
  },
]

export function getPosts(_req: Request, res: Response): void {
  res.json({ success: true, data: posts })
}

export function createPost(req: Request, res: Response): void {
  const body = req.body as Omit<CalendarPost, 'id'>
  if (!body.title || !body.platform || !body.scheduledAt) {
    res.status(400).json({ success: false, error: 'title, platform y scheduledAt son requeridos' })
    return
  }
  const post: CalendarPost = { ...body, id: uuid() }
  posts.push(post)
  res.status(201).json({ success: true, data: post })
}

export function updatePost(req: Request, res: Response): void {
  const { id } = req.params
  const idx = posts.findIndex((p) => p.id === id)
  if (idx === -1) {
    res.status(404).json({ success: false, error: 'Post no encontrado' })
    return
  }
  posts[idx] = { ...posts[idx], ...req.body, id }
  res.json({ success: true, data: posts[idx] })
}

export function deletePost(req: Request, res: Response): void {
  const { id } = req.params
  const idx = posts.findIndex((p) => p.id === id)
  if (idx === -1) {
    res.status(404).json({ success: false, error: 'Post no encontrado' })
    return
  }
  posts.splice(idx, 1)
  res.json({ success: true, data: null })
}
