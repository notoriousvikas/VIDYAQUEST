import { Router } from 'express';
import { requireAuth } from '../../../middleware/auth';
import { validateRequest } from '../../../middleware/validate';
import { claimReward, listRewards } from '../controllers/rewards.controller';
import { claimRewardParamSchema } from '../validators/gamification.validator';

const router = Router();

router.get('/', requireAuth, listRewards);
router.post(
  '/:achievementId/claim',
  requireAuth,
  validateRequest(claimRewardParamSchema),
  claimReward,
);

export const rewardsRoutes = router;
