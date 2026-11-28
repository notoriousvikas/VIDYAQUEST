import { Router } from 'express';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ success: true, module: 'assessment', status: 'ok' });
});

export const assessmentRouter = router;
