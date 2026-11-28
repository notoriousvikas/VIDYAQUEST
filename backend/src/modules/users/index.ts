import { Router } from 'express';
export { studentDashboardRoutes } from './routes/studentDashboard.routes';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ success: true, module: 'users', status: 'ok' });
});

export const usersRouter = router;
