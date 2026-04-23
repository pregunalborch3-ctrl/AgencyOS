import { Router } from 'express'
import { getPosts, createPost, updatePost, deletePost } from '../controllers/calendarController'
import { requireAuth } from '../middleware/authMiddleware'

const router = Router()

router.use(requireAuth)

router.get('/', getPosts)
router.post('/', createPost)
router.put('/:id', updatePost)
router.delete('/:id', deletePost)

export default router
