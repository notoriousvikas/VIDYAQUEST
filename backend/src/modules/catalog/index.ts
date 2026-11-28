import { Router } from 'express';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ success: true, module: 'catalog', status: 'ok' });
});

export const catalogRouter = router;
