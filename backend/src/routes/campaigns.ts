import { Router } from 'express'
import { generateCampaign } from '../controllers/campaignController'
import { requireAuth } from '../middleware/authMiddleware'

const router = Router()

router.post('/generate', requireAuth, generateCampaign)

export default router
