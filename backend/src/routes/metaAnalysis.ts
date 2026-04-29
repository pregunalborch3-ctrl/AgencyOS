import { Router } from 'express'
import { requireAuth } from '../middleware/authMiddleware'
import { requireSubscription } from '../middleware/authMiddleware'
import { upload, analyzeMetaAds } from '../controllers/metaAnalysisController'

const router = Router()

router.post('/analyze', requireAuth, requireSubscription, upload.single('file'), analyzeMetaAds)

export default router
