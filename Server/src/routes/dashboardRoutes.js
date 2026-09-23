import express from 'express';
import { getSummary, getDiseaseDistribution, getHotspots } from '../controllers/dashboardController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use(authorize('AGRICULTURAL_OFFICER', 'ADMIN'));

router.get('/summary', getSummary);
router.get('/disease-distribution', getDiseaseDistribution);
router.get('/hotspots', getHotspots);

export default router;
