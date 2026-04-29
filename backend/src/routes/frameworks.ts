import { Router } from 'express'
import {
  analyzeMarket,
  mapCompetition,
  planDistribution,
  viralContent,
  scalingRoadmap,
} from '../controllers/frameworksController'
import { requireAuth, requireSubscription } from '../middleware/authMiddleware'
import { frameworksLimiter } from '../middleware/security'

const router = Router()

router.post('/mercado',      requireAuth, requireSubscription, frameworksLimiter, analyzeMarket)
router.post('/competencia',  requireAuth, requireSubscription, frameworksLimiter, mapCompetition)
router.post('/distribucion', requireAuth, requireSubscription, frameworksLimiter, planDistribution)
router.post('/contenido',    requireAuth, requireSubscription, frameworksLimiter, viralContent)
router.post('/escalado',     requireAuth, requireSubscription, frameworksLimiter, scalingRoadmap)

export default router
