import Report from '../models/Report.js';
import MLJob from '../models/MLJob.js';

export const getSummary = async (req, res) => {
  try {
    const totalReports = await Report.countDocuments();
    const activeCases = await Report.countDocuments({ status: { $ne: 'RESOLVED' } });
    const highRiskCases = await Report.countDocuments({ severity: 'HIGH' });
    const resolvedCases = await Report.countDocuments({ status: 'RESOLVED' });

    res.json({ totalReports, activeCases, highRiskCases, resolvedCases });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getDiseaseDistribution = async (req, res) => {
  try {
    const distribution = await Report.aggregate([
      { $group: { _id: '$cropType', count: { $sum: 1 } } }
    ]);
    res.json(distribution);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getHotspots = async (req, res) => {
  try {
    // Basic implementation: just return high severity reports with locations
    const hotspots = await Report.find({ severity: 'HIGH', latitude: { $exists: true }, longitude: { $exists: true } })
                                 .select('latitude longitude severity cropType reportId');
    res.json(hotspots);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
