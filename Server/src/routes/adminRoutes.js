import express from 'express';
import { getAdminStats, getOfficerStats, getAllReportsAdmin } from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use(authorize('ADMIN'));

router.get('/stats', getAdminStats);
router.get('/officers', getOfficerStats);
router.get('/reports', getAllReportsAdmin);

export default router;
