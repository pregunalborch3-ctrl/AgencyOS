import { Router } from 'express'
import { generateCampaign, saveCampaign, getCampaigns, deleteCampaign } from '../controllers/campaignController'
import { analyzeShopifyUrl } from '../controllers/shopifyController'
import { requireAuth } from '../middleware/authMiddleware'

const router = Router()

router.post('/generate',      requireAuth, generateCampaign)
router.post('/analyze-url',   requireAuth, analyzeShopifyUrl)
router.post('/',              requireAuth, saveCampaign)
router.get('/',               requireAuth, getCampaigns)
router.delete('/:id',         requireAuth, deleteCampaign)

export default router
