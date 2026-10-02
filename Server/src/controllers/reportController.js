import Report from '../models/Report.js';
import MLJob from '../models/MLJob.js';
import { addMlJob } from '../queues/mlQueue.js';
import { processMLForReport } from '../queues/mlWorker.js';

export const createReport = async (req, res) => {
  try {
    const { reportId, cropType, latitude, longitude, description, severity } = req.body;
    // Accept base64 image or URL reference
    const imageReference = req.body.imageReference || 'dummy_image.jpg'; 

    const existingReport = await Report.findOne({ reportId });
    if (existingReport) {
      return res.status(200).json({ message: 'Report already exists (synced)', report: existingReport });
    }

    const report = new Report({
      reportId,
      userId: req.user.id,
      imageReference,
      cropType,
      latitude,
      longitude,
      description,
      severity,
      status: 'PENDING',
      syncStatus: 'SYNCED'
    });

    await report.save();

    // Create ML Job record
    const mlJob = new MLJob({
      reportId: report.reportId,
      status: 'QUEUED'
    });
    await mlJob.save();

    const io = req.app.get('io');

    // Queue for async ML processing via BullMQ
    let queuedJob = null;
    try {
      queuedJob = await addMlJob(report.reportId, imageReference);
    } catch (qErr) {
      console.warn("BullMQ queue error:", qErr.message);
    }

    // If BullMQ is offline (Redis not connected), process ML asynchronously in background
    if (!queuedJob) {
      setImmediate(() => {
        processMLForReport(report.reportId, imageReference, io).catch(err => {
          console.error(`[ML Background] Error processing ${report.reportId}:`, err.message);
        });
      });
    }

    // Emit event to officer dashboard
    if (io) {
      io.emit('report:created', { reportId: report.reportId, location: { lat: latitude, lng: longitude } });
    }

    res.status(201).json({ message: 'Report created successfully', report });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getReports = async (req, res) => {
  try {
    // FIELD_WORKER sees only their own reports; OFFICER/ADMIN sees all
    let filter = {};
    if (req.user.role === 'FIELD_WORKER') {
      filter.userId = req.user.id;
    }

    const reports = await Report.find(filter).sort({ createdAt: -1 });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getReportById = async (req, res) => {
  try {
    const report = await Report.findOne({ reportId: req.params.id })
      .populate('userId', 'name email region')
      .populate('officerId', 'name email');
    if (!report) return res.status(404).json({ message: 'Report not found' });
    
    // Authorization check — farmer can only view own reports
    if (req.user.role === 'FIELD_WORKER' && report.userId._id?.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(report);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * PATCH /api/reports/:id/recommend
 * Agricultural officer adds recommendation to a specific report.
 * Only AGRICULTURAL_OFFICER or ADMIN can call this.
 */
export const addOfficerRecommendation = async (req, res) => {
  try {
    const { officerRecommendation, officerMedicine, officerNotes } = req.body;

    const report = await Report.findOne({ reportId: req.params.id });
    if (!report) return res.status(404).json({ message: 'Report not found' });

    report.officerId = req.user.id;
    report.officerRecommendation = officerRecommendation || report.officerRecommendation;
    report.officerMedicine = officerMedicine || report.officerMedicine;
    report.officerNotes = officerNotes || report.officerNotes;
    report.officerReviewedAt = new Date();
    report.status = 'RESOLVED';

    await report.save();

    // Notify farmer via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.emit(`report:resolved:${report.userId.toString()}`, {
        reportId: report.reportId,
        officerRecommendation: report.officerRecommendation,
        officerMedicine: report.officerMedicine,
        officerNotes: report.officerNotes
      });
      // Also update officer dashboard
      io.emit('report:resolved', { reportId: report.reportId });
    }

    res.json({ message: 'Recommendation saved successfully', report });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * GET /api/reports/all
 * Get all reports (for officer GIS map — includes all severities with GPS)
 */
export const getAllReportsForMap = async (req, res) => {
  try {
    const reports = await Report.find({
      latitude: { $exists: true },
      longitude: { $exists: true }
    })
      .select('reportId cropType latitude longitude severity status disease confidence createdAt userId')
      .sort({ createdAt: -1 });

    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
