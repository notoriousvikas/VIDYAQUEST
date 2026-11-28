import { Router } from 'express';
import { requireAuth, requireRole } from '../../../middleware/auth';
import { validateRequest } from '../../../middleware/validate';
import { adminUpsertMission, adminUpsertZone } from '../controllers/studentMap.controller';
import {
  adminUpsertMissionSchema,
  adminUpsertZoneSchema,
} from '../validators/gamification.validator';

const router = Router();

router.use(requireAuth, requireRole('teacher', 'admin'));

router.post('/zones', validateRequest(adminUpsertZoneSchema), adminUpsertZone);
router.post('/missions', validateRequest(adminUpsertMissionSchema), adminUpsertMission);

export const adminMapRoutes = router;
