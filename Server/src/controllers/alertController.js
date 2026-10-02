import Alert from '../models/Alert.js';
import User from '../models/User.js';
import Report from '../models/Report.js';

/**
 * Haversine formula — calculate distance between two GPS coordinates in km
 */
const haversineDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * POST /api/alerts
 * Officer creates a regional alert.
 * System finds all FIELD_WORKER users within radiusKm of center coordinates,
 * stores their IDs, and emits a real-time Socket.IO event to each.
 */
export const createAlert = async (req, res) => {
  try {
    const { message, centerLat, centerLng, radiusKm = 10, diseaseType, severity, title, affectedReportIds } = req.body;

    if (!message || centerLat === undefined || centerLng === undefined) {
      return res.status(400).json({ message: 'message, centerLat, and centerLng are required' });
    }

    // Find all farmers who have submitted reports in the region
    // First, find all reports near the center coordinate
    const nearbyReports = await Report.find({
      latitude: { $exists: true },
      longitude: { $exists: true }
    }).populate('userId', 'name email role');

    // Filter reports within radius
    const affectedFarmerIds = new Set();
    for (const report of nearbyReports) {
      if (!report.latitude || !report.longitude) continue;
      const dist = haversineDistance(centerLat, centerLng, report.latitude, report.longitude);
      if (dist <= radiusKm && report.userId && report.userId.role === 'FIELD_WORKER') {
        affectedFarmerIds.add(report.userId._id.toString());
      }
    }

    // Also find all FIELD_WORKER users (those without specific location data)
    // This is a fallback to ensure farmers in the general region receive alerts
    const allFarmers = await User.find({ role: 'FIELD_WORKER' });

    // If fewer than 3 farmers found via reports, include all farmers (small dataset)
    if (affectedFarmerIds.size < 3) {
      allFarmers.forEach(f => affectedFarmerIds.add(f._id.toString()));
    }

    const officerUser = await User.findById(req.user.id).select('name');

    const alert = new Alert({
      officerId: req.user.id,
      officerName: officerUser?.name || 'Agricultural Officer',
      title: title || 'Crop Disease Alert',
      message,
      diseaseType,
      severity: severity || 'HIGH',
      centerLat: parseFloat(centerLat),
      centerLng: parseFloat(centerLng),
      radiusKm: parseFloat(radiusKm),
      targetFarmerIds: Array.from(affectedFarmerIds),
      affectedReportIds: affectedReportIds || []
    });

    await alert.save();

    // Emit real-time alert to all affected farmers via Socket.IO
    const io = req.app.get('io');
    if (io) {
      const alertPayload = {
        alertId: alert._id.toString(),
        title: alert.title,
        message: alert.message,
        diseaseType: alert.diseaseType,
        severity: alert.severity,
        officerName: alert.officerName,
        radiusKm: alert.radiusKm,
        createdAt: alert.createdAt
      };

      // Emit to each farmer's personal room
      for (const farmerId of affectedFarmerIds) {
        io.emit(`alert:farmer:${farmerId}`, alertPayload);
      }

      // Also broadcast to officer channel for confirmation
      io.emit('alert:created', {
        ...alertPayload,
        affectedFarmers: affectedFarmerIds.size
      });
    }

    res.status(201).json({
      message: 'Alert created and dispatched successfully',
      alert,
      affectedFarmers: affectedFarmerIds.size
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * GET /api/alerts/my
 * Farmer gets their own alerts (targeted to their farmer ID)
 */
export const getMyAlerts = async (req, res) => {
  try {
    const farmerId = req.user.id;
    const alerts = await Alert.find({
      targetFarmerIds: farmerId,
      isActive: true
    }).sort({ createdAt: -1 }).limit(20);

    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * GET /api/alerts
 * Officer/Admin gets all alerts
 */
export const getAllAlerts = async (req, res) => {
  try {
    const alerts = await Alert.find({}).sort({ createdAt: -1 }).limit(50);
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
