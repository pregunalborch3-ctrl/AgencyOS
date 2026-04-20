import { Router } from 'express'
import { register, login, me } from '../controllers/authController'
import { requireAuth } from '../middleware/authMiddleware'
import { authLimiter } from '../middleware/security'

const router = Router()

router.post('/register', authLimiter, register)
router.post('/login',    authLimiter, login)
router.get('/me',        requireAuth, me)

export default router
