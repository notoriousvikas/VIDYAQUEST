import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validate';
import {
  completeLabExperiment,
  listLabs,
  resolveLabForMission,
  serveLabAsset,
  startLabAttempt,
} from './controllers/labs.controller';
import {
  completeLabSchema,
  listLabsQuerySchema,
  resolveMissionLabSchema,
  startLabAttemptSchema,
} from './validators/lab.validator';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ success: true, module: 'labs', status: 'ok' });
});

// Serve lab assets (HTML5 3D labs, GLB/GLTF, textures, JSON) safely from /lab
router.get('/assets/:labId', serveLabAsset);
router.get('/assets/:labId/*', serveLabAsset);

// Protected student lab discovery, attempt tracking, and validated completion
router.use(requireAuth);

router.get('/', validateRequest(listLabsQuerySchema), listLabs);
router.get(
  '/resolve/mission/:missionId',
  validateRequest(resolveMissionLabSchema),
  resolveLabForMission,
);
router.post(
  '/:labId/attempt/start',
  validateRequest(startLabAttemptSchema),
  startLabAttempt,
);
router.post(
  '/:labId/complete',
  validateRequest(completeLabSchema),
  completeLabExperiment,
);

export const labsRouter = router;
