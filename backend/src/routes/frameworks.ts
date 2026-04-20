import { Router } from 'express'
import {
  analyzeMarket,
  mapCompetition,
  planDistribution,
  viralContent,
  scalingRoadmap,
} from '../controllers/frameworksController'
import { requireAuth } from '../middleware/authMiddleware'

const router = Router()

router.post('/mercado',      requireAuth, analyzeMarket)
router.post('/competencia',  requireAuth, mapCompetition)
router.post('/distribucion', requireAuth, planDistribution)
router.post('/contenido',    requireAuth, viralContent)
router.post('/escalado',     requireAuth, scalingRoadmap)

export default router
