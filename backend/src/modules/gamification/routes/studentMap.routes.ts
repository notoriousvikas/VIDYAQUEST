import { Router } from 'express';
import { requireAuth } from '../../../middleware/auth';
import { validateRequest } from '../../../middleware/validate';
import {
  completeMission,
  getDefaultMap,
  getMissionDetails,
  getOverallMapProgress,
  getSubjectMap,
  getSubjectProgress,
  getZoneDetails,
  listStudentSubjects,
  startMission,
} from '../controllers/studentMap.controller';
import {
  completeStudentMissionSchema,
  studentMissionIdParamSchema,
  subjectIdParamSchema,
  zoneIdParamSchema,
} from '../validators/gamification.validator';

const router = Router();

router.use(requireAuth);

// Subject-specific dynamic map endpoints
router.get('/subjects', listStudentSubjects);
router.get('/subjects/:subjectId/map', validateRequest(subjectIdParamSchema), getSubjectMap);
router.get(
  '/subjects/:subjectId/progress',
  validateRequest(subjectIdParamSchema),
  getSubjectProgress,
);

// Consolidated student map & mission progression endpoints
router.get('/map', getDefaultMap);
router.get('/map/progress', getOverallMapProgress);
router.get('/map/zones/:zoneId', validateRequest(zoneIdParamSchema), getZoneDetails);
router.get(
  '/map/missions/:missionId',
  validateRequest(studentMissionIdParamSchema),
  getMissionDetails,
);
router.post(
  '/map/missions/:missionId/start',
  validateRequest(studentMissionIdParamSchema),
  startMission,
);
router.post(
  '/map/missions/:missionId/complete',
  validateRequest(completeStudentMissionSchema),
  completeMission,
);

export const studentMapRoutes = router;
