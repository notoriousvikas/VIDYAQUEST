import { Router } from 'express';
import { requireAuth } from '../../../middleware/auth';
import { validateRequest } from '../../../middleware/validate';
import {
  deleteSavedOutfit,
  getSavedOutfits,
  getStudentAchievements,
  getStudentActivity,
  getStudentAvatar,
  getStudentAvatarItems,
  getStudentConquerors,
  getStudentDashboard,
  patchSavedOutfit,
  patchStudentAvatar,
  patchStudentProfile,
  postSavedOutfit,
} from '../controllers/studentDashboard.controller';
import {
  createSavedOutfitSchema,
  updateAvatarSchema,
  updateProfileSchema,
  updateSavedOutfitSchema,
} from '../validators/studentDashboard.validator';

const router = Router();

router.use(requireAuth);

router.get('/dashboard', getStudentDashboard);
router.get('/avatar', getStudentAvatar);
router.patch('/avatar', validateRequest(updateAvatarSchema), patchStudentAvatar);
router.get('/avatar/items', getStudentAvatarItems);
router.get('/outfits', getSavedOutfits);
router.post('/outfits', validateRequest(createSavedOutfitSchema), postSavedOutfit);
router.patch('/outfits/:outfitId', validateRequest(updateSavedOutfitSchema), patchSavedOutfit);
router.delete('/outfits/:outfitId', deleteSavedOutfit);
router.get('/achievements', getStudentAchievements);
router.get('/conquerors', getStudentConquerors);
router.get('/activity', getStudentActivity);
router.patch('/profile', validateRequest(updateProfileSchema), patchStudentProfile);

export const studentDashboardRoutes = router;
