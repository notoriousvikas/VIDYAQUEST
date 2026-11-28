import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validate';
import {
  getCodingChallenge,
  getCodingLevel,
  getCodingLevelProgress,
  getCodingProgress,
  listCodingLevels,
  requestCodingHint,
  runCodingCode,
  submitCodingSolution,
} from './controllers/coding.controller';
import {
  challengeIdParamSchema,
  codingHintSchema,
  levelIdParamSchema,
  runCodeSchema,
  submitCodeSchema,
} from './validators/coding.validator';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ success: true, module: 'coding', status: 'ok' });
});

router.use(requireAuth);

router.get('/levels', listCodingLevels);
router.get('/levels/:levelId', validateRequest(levelIdParamSchema), getCodingLevel);
router.get(
  '/challenges/:challengeId',
  validateRequest(challengeIdParamSchema),
  getCodingChallenge,
);
router.post('/run', validateRequest(runCodeSchema), runCodingCode);
router.post('/submit', validateRequest(submitCodeSchema), submitCodingSolution);
router.get('/progress', getCodingProgress);
router.get(
  '/progress/:levelId',
  validateRequest(levelIdParamSchema),
  getCodingLevelProgress,
);
router.post('/hint', validateRequest(codingHintSchema), requestCodingHint);

export const codingRouter = router;
