import { Router } from 'express'
import { requireAuth } from '../middleware/authMiddleware'
import { requirePlan } from '../middleware/planGuard'
import { listApiKeys, createApiKey, deleteApiKey } from '../controllers/apiKeyController'

const router = Router()

router.get('/',       requireAuth, requirePlan('enterprise'), listApiKeys)
router.post('/',      requireAuth, requirePlan('enterprise'), createApiKey)
router.delete('/:id', requireAuth, requirePlan('enterprise'), deleteApiKey)

export default router
