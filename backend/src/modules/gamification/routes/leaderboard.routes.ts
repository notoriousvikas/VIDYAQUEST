import { Router } from 'express';
import { requireAuth } from '../../../middleware/auth';
import { validateRequest } from '../../../middleware/validate';
import {
  getLeaderboard,
  getLeaderboardStudentDetails,
  getMyRank,
} from '../controllers/leaderboard.controller';
import {
  leaderboardMeQuerySchema,
  leaderboardQuerySchema,
  leaderboardStudentParamSchema,
} from '../validators/gamification.validator';

const router = Router();

router.use(requireAuth);

router.get('/', validateRequest(leaderboardQuerySchema), getLeaderboard);
router.get('/me', validateRequest(leaderboardMeQuerySchema), getMyRank);
router.get(
  '/:studentId',
  validateRequest(leaderboardStudentParamSchema),
  getLeaderboardStudentDetails,
);

export const leaderboardRoutes = router;
