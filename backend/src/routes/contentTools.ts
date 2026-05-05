import { Router } from 'express'
import { requireAuth } from '../middleware/authMiddleware'
import { generateContentTool } from '../controllers/contentToolsController'

const router = Router()
router.post('/generate', requireAuth, generateContentTool)
export default router
