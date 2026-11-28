import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validate';
import { getMe, login, register } from './controllers/auth.controller';
import { loginSchema, registerSchema } from './validators/auth.validator';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ success: true, module: 'identity', status: 'ok' });
});

router.post('/register', validateRequest(registerSchema), register);
router.post('/login', validateRequest(loginSchema), login);
router.get('/me', requireAuth, getMe);

export const identityRouter = router;
