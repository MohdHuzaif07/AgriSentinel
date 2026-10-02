import express from 'express';
import { createAlert, getMyAlerts, getAllAlerts } from '../controllers/alertController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

// GET alerts for a specific farmer (their personal alerts)
router.get('/my', authorize('FIELD_WORKER'), getMyAlerts);

// GET all alerts (officer/admin)
router.get('/', authorize('AGRICULTURAL_OFFICER', 'ADMIN'), getAllAlerts);

// POST create a new regional alert (officer/admin only)
router.post('/', authorize('AGRICULTURAL_OFFICER', 'ADMIN'), createAlert);

export default router;
