import { Router } from 'express';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ success: true, module: 'progress', status: 'ok' });
});

export const progressRouter = router;
