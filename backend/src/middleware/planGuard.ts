import { Request, Response, NextFunction } from 'express'
import { UserStore } from '../models/User'
import { getPlanTier, hasAccess, type PlanTier } from '../utils/plan'

const PLAN_LABELS: Record<PlanTier, string> = {
  free:       'Gratuito',
  starter:    'Starter',
  pro:        'Pro',
  enterprise: 'Enterprise',
}

export function requirePlan(tier: PlanTier) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await UserStore.findById(req.user!.userId)
      if (!user) {
        res.status(401).json({ success: false, error: 'Usuario no encontrado.' })
        return
      }
      if (user.role === 'admin') { next(); return }

      const userTier = getPlanTier(user.subscription?.priceId)
      if (!hasAccess(userTier, tier)) {
        res.status(403).json({
          success: false,
          error: `Esta función requiere el plan ${PLAN_LABELS[tier]} o superior.`,
          requiredPlan: tier,
        })
        return
      }
      next()
    } catch {
      res.status(500).json({ success: false, error: 'Error al verificar el plan.' })
    }
  }
}
