import { Router } from 'express';
import { requireAuth } from '../../../middleware/auth';
import {
  getStreak,
  getStreakHistory,
  getStreakRewards,
  useStreakFreeze,
} from '../controllers/streak.controller';

const router = Router();

router.use(requireAuth);

router.get('/', getStreak);
router.get('/history', getStreakHistory);
router.get('/rewards', getStreakRewards);
router.post('/freeze/use', useStreakFreeze);

export default router;
