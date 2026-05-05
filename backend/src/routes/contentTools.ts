import { Router } from 'express'
import { requireAuth } from '../middleware/authMiddleware'
import { generateContentTool, parseReachFile, upload } from '../controllers/contentToolsController'

const router = Router()
router.post('/generate',   requireAuth, generateContentTool)
router.post('/parse-file', requireAuth, upload.single('file'), parseReachFile)
export default router
