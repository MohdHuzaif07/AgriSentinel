import express from 'express';
import { createReport, getReports, getReportById, addOfficerRecommendation, getAllReportsForMap } from '../controllers/reportController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// GET all reports on map (officer/admin only)
router.get('/map', authorize('AGRICULTURAL_OFFICER', 'ADMIN'), getAllReportsForMap);

// POST create a new report (field workers + officers can file)
router.post('/', authorize('FIELD_WORKER', 'AGRICULTURAL_OFFICER'), createReport);

// GET reports — field workers see own, officers/admins see all
router.get('/', getReports);

// GET single report by reportId
router.get('/:id', getReportById);

// PATCH officer recommendation on a specific report
router.patch('/:id/recommend', authorize('AGRICULTURAL_OFFICER', 'ADMIN'), addOfficerRecommendation);

export default router;
