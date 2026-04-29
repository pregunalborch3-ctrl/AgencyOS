import { Router } from 'express'
import { register, login, me, forgotPassword, resetPassword, markOnboardingDone } from '../controllers/authController'
import { requireAuth } from '../middleware/authMiddleware'
import { authLimiter } from '../middleware/security'

const router = Router()

router.post('/register',        authLimiter, register)
router.post('/login',           authLimiter, login)
router.get('/me',               requireAuth, me)
router.post('/forgot-password', authLimiter, forgotPassword)
router.post('/reset-password',  authLimiter, resetPassword)
router.post('/onboarding-done', requireAuth, markOnboardingDone)

export default router
