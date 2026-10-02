import User from '../models/User.js';
import Report from '../models/Report.js';
import Alert from '../models/Alert.js';
import MLJob from '../models/MLJob.js';

/**
 * GET /api/admin/stats
 * Overall system statistics for admin dashboard
 */
export const getAdminStats = async (req, res) => {
  try {
    const [totalFarmers, totalOfficers, totalReports, pendingReports, analyzedReports, resolvedReports, totalAlerts, highRiskReports] = await Promise.all([
      User.countDocuments({ role: 'FIELD_WORKER' }),
      User.countDocuments({ role: 'AGRICULTURAL_OFFICER' }),
      Report.countDocuments(),
      Report.countDocuments({ status: 'PENDING' }),
      Report.countDocuments({ status: 'ANALYZED' }),
      Report.countDocuments({ status: 'RESOLVED' }),
      Alert.countDocuments(),
      Report.countDocuments({ severity: 'HIGH' })
    ]);

    // Disease distribution
    const diseaseDistribution = await Report.aggregate([
      { $match: { disease: { $exists: true, $ne: null } } },
      { $group: { _id: '$disease', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentReports = await Report.countDocuments({ createdAt: { $gte: sevenDaysAgo } });

    res.json({
      totalFarmers,
      totalOfficers,
      totalReports,
      pendingReports,
      analyzedReports,
      resolvedReports,
      totalAlerts,
      highRiskReports,
      diseaseDistribution,
      recentReports
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * GET /api/admin/officers
 * Officer list with activity statistics
 */
export const getOfficerStats = async (req, res) => {
  try {
    const officers = await User.find({ role: 'AGRICULTURAL_OFFICER' }).select('-passwordHash');

    // For each officer, count how many reports they've reviewed and alerts they've sent
    const officerStats = await Promise.all(
      officers.map(async (officer) => {
        const [reportsReviewed, alertsSent, recentAlerts] = await Promise.all([
          Report.countDocuments({ officerId: officer._id }),
          Alert.countDocuments({ officerId: officer._id }),
          Alert.countDocuments({ officerId: officer._id, createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } })
        ]);

        return {
          _id: officer._id,
          name: officer.name,
          email: officer.email,
          region: officer.region,
          preferredLanguage: officer.preferredLanguage,
          createdAt: officer.createdAt,
          reportsReviewed,
          alertsSent,
          recentAlerts
        };
      })
    );

    res.json(officerStats);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * GET /api/admin/reports
 * All reports (admin view)
 */
export const getAllReportsAdmin = async (req, res) => {
  try {
    const reports = await Report.find({})
      .populate('userId', 'name email region')
      .populate('officerId', 'name email')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
