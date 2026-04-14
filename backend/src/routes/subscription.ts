import { Router } from 'express'
import {
  getStatus,
  createCheckoutSession,
  createPortalSession,
  cancelSubscription,
  reactivateSubscription,
  handleWebhook,
} from '../controllers/subscriptionController'
import { requireAuth } from '../middleware/authMiddleware'

const router = Router()

// Webhook must use raw body — mounted with express.raw() in index.ts
router.post('/webhook', handleWebhook)

// Authenticated endpoints
router.get('/status',       requireAuth, getStatus)
router.post('/checkout',    requireAuth, createCheckoutSession)
router.post('/portal',      requireAuth, createPortalSession)
router.post('/cancel',      requireAuth, cancelSubscription)
router.post('/reactivate',  requireAuth, reactivateSubscription)

export default router
