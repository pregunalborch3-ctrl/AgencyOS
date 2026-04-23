import { Router } from 'express'
import { getBudgets, getBudget, createBudget, updateBudget, deleteBudget } from '../controllers/budgetController'
import { requireAuth } from '../middleware/authMiddleware'

const router = Router()

router.use(requireAuth)

router.get('/', getBudgets)
router.get('/:id', getBudget)
router.post('/', createBudget)
router.put('/:id', updateBudget)
router.delete('/:id', deleteBudget)

export default router
