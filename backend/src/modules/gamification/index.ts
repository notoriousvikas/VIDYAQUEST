import { Router } from 'express';
import { adminMapRoutes } from './routes/adminMap.routes';
import { gameMapRoutes } from './routes/gameMap.routes';
import { leaderboardRoutes } from './routes/leaderboard.routes';
import { missionsRoutes } from './routes/missions.routes';
import { rewardsRoutes } from './routes/rewards.routes';
import streakRoutes from './routes/streak.routes';
import { studentMapRoutes } from './routes/studentMap.routes';

const router = Router();

router.use('/map', gameMapRoutes);
router.use('/leaderboard', leaderboardRoutes);
router.use('/rewards', rewardsRoutes);
router.use('/missions', missionsRoutes);

export const gamificationRouter = router;
export { adminMapRoutes, leaderboardRoutes, streakRoutes, studentMapRoutes };
