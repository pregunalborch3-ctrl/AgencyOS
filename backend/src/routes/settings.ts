import { Router } from 'express'
import { getSettings, updateSettings } from '../controllers/settingsController'
import { requireAuth } from '../middleware/authMiddleware'

const router = Router()

router.get('/',   requireAuth, getSettings)
router.patch('/', requireAuth, updateSettings)

export default router
