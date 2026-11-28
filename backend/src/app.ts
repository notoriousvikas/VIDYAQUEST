import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { assessmentRouter } from './modules/assessment';
import { catalogRouter } from './modules/catalog';
import { codingRouter } from './modules/coding';
import {
  adminMapRoutes,
  gamificationRouter,
  leaderboardRoutes,
  streakRoutes,
  studentMapRoutes,
} from './modules/gamification';
import { identityRouter } from './modules/identity';
import { labsRouter } from './modules/labs';
import { progressRouter } from './modules/progress';
import { studentDashboardRoutes, usersRouter } from './modules/users';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ success: true, status: 'ok', service: 'vidyaquest-backend' });
  });

  app.use('/api/v1/identity', identityRouter);
  app.use('/api/v1/users', usersRouter);
  app.use('/api/v1/catalog', catalogRouter);
  app.use('/api/v1/labs', labsRouter);
  app.use('/api/v1/coding', codingRouter);
  app.use('/api/coding', codingRouter);
  app.use('/api/v1/progress', progressRouter);
  app.use('/api/v1/assessment', assessmentRouter);
  app.use('/api/v1/gamification', gamificationRouter);
  app.use('/api/v1/leaderboard', leaderboardRoutes);
  app.use('/api/v1/streak', streakRoutes);
  app.use('/api/streak', streakRoutes);
  app.use('/api/v1/student', studentMapRoutes);
  app.use('/api/v1/student', studentDashboardRoutes);
  app.use('/api/v1/admin/map', adminMapRoutes);

  app.use((_req, res) => {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Route not found' },
    });
  });

  app.use(errorHandler);

  return app;
}
