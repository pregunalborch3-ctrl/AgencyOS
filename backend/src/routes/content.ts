import { Router } from 'express'
import { generateContent, getContentHistory } from '../controllers/contentController'

const router = Router()

router.post('/generate', generateContent)
router.get('/history', getContentHistory)

export default router
