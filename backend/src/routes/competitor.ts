import { Router } from 'express'
import { getCompetitors, getCompetitor, createCompetitor, updateCompetitor, deleteCompetitor } from '../controllers/competitorController'
import { requireAuth } from '../middleware/authMiddleware'

const router = Router()

router.use(requireAuth)

router.get('/', getCompetitors)
router.get('/:id', getCompetitor)
router.post('/', createCompetitor)
router.put('/:id', updateCompetitor)
router.delete('/:id', deleteCompetitor)

export default router
