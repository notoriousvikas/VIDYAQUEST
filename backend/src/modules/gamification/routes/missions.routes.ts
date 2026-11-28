import { Router } from 'express';
import { requireAuth } from '../../../middleware/auth';
import { validateRequest } from '../../../middleware/validate';
import { completeMission, listMissions } from '../controllers/missions.controller';
import { completeMissionParamSchema } from '../validators/gamification.validator';

const router = Router();

router.get('/', requireAuth, listMissions);
router.post(
  '/:missionId/complete',
  requireAuth,
  validateRequest(completeMissionParamSchema),
  completeMission,
);

export const missionsRoutes = router;
