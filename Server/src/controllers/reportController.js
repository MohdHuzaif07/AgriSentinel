import Report from '../models/Report.js';
import MLJob from '../models/MLJob.js';
import { addMlJob } from '../queues/mlQueue.js';

export const createReport = async (req, res) => {
  try {
    const { reportId, cropType, latitude, longitude, description, severity } = req.body;
    // Mock image handling for now; expect base64 or URL
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

    // Queue for async processing
    try {
      await addMlJob(report.reportId, imageReference);
    } catch (qErr) {
      console.warn("Could not add to queue, marking as failed.");
      mlJob.status = 'FAILED';
      mlJob.error = 'Queue unavailable';
      await mlJob.save();
    }

    // Emit event
    const io = req.app.get('io');
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
    // If officer/admin, see all. If field worker, see only theirs.
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
    const report = await Report.findOne({ reportId: req.params.id });
    if (!report) return res.status(404).json({ message: 'Report not found' });
    
    // Authorization check
    if (req.user.role === 'FIELD_WORKER' && report.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(report);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
