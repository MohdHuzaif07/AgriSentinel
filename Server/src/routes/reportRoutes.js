import express from 'express';
import { createReport, getReports, getReportById } from '../controllers/reportController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/', protect, authorize('FIELD_WORKER', 'AGRICULTURAL_OFFICER'), createReport);
router.get('/', protect, getReports);
router.get('/:id', protect, getReportById);

export default router;
