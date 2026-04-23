import { Router } from 'express'
import { generateContent, getContentHistory } from '../controllers/contentController'
import { requireAuth } from '../middleware/authMiddleware'

const router = Router()

router.use(requireAuth)

router.post('/generate', generateContent)
router.get('/history', getContentHistory)

export default router
