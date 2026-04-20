import { Router } from 'express'
import { getDailyTip } from '../controllers/homeController'
import { requireAuth } from '../middleware/authMiddleware'

const router = Router()

router.get('/tip', requireAuth, getDailyTip)

export default router
