import { Router } from 'express'
import { generateContent, getContentHistory } from '../controllers/contentController'
import { requireAuth } from '../middleware/authMiddleware'
import { contentLimiter } from '../middleware/security'

const router = Router()

router.use(requireAuth)

router.post('/generate', contentLimiter, generateContent)
router.get('/history', getContentHistory)

export default router
