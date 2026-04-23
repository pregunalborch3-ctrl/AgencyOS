import { Router } from 'express'
import { getBriefings, getBriefing, createBriefing, updateBriefing, deleteBriefing } from '../controllers/briefingController'
import { requireAuth } from '../middleware/authMiddleware'

const router = Router()

router.use(requireAuth)

router.get('/', getBriefings)
router.get('/:id', getBriefing)
router.post('/', createBriefing)
router.put('/:id', updateBriefing)
router.delete('/:id', deleteBriefing)

export default router
