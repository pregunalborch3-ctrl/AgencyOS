import { Router } from 'express'
import {
  analyzeMarket,
  mapCompetition,
  planDistribution,
  viralContent,
  scalingRoadmap,
} from '../controllers/frameworksController'
import { requireAuth } from '../middleware/authMiddleware'
import { frameworksLimiter } from '../middleware/security'

const router = Router()

router.post('/mercado',      requireAuth, frameworksLimiter, analyzeMarket)
router.post('/competencia',  requireAuth, frameworksLimiter, mapCompetition)
router.post('/distribucion', requireAuth, frameworksLimiter, planDistribution)
router.post('/contenido',    requireAuth, frameworksLimiter, viralContent)
router.post('/escalado',     requireAuth, frameworksLimiter, scalingRoadmap)

export default router
