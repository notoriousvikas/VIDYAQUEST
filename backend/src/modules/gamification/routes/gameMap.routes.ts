import { Router } from 'express';
import { requireAuth } from '../../../middleware/auth';
import { validateRequest } from '../../../middleware/validate';
import { completeNode, getWorldMap, listWorlds } from '../controllers/gameMap.controller';
import { nodeIdParamSchema, worldIdParamSchema } from '../validators/gamification.validator';

const router = Router();

router.get('/worlds', listWorlds);
router.get('/worlds/:worldId', requireAuth, validateRequest(worldIdParamSchema), getWorldMap);
router.post('/nodes/:nodeId/complete', requireAuth, validateRequest(nodeIdParamSchema), completeNode);

export const gameMapRoutes = router;
