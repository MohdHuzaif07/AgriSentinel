import { getPendingSyncReports, removeSyncedReport } from './db.js';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const syncPendingReports = async (token) => {
  if (!navigator.onLine) return;
  
  try {
    const pendingReports = await getPendingSyncReports();
    if (pendingReports.length === 0) return;

    console.log(`Attempting to sync ${pendingReports.length} reports...`);

    for (const report of pendingReports) {
      try {
        await axios.post(`${API_URL}/reports`, report, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Success: remove from pending queue
        await removeSyncedReport(report.reportId);
        console.log(`Synced report ${report.reportId}`);
      } catch (err) {
        console.error(`Failed to sync report ${report.reportId}:`, err);
        // Could implement retry logic based on status code
      }
    }
  } catch (err) {
    console.error('Error during sync process', err);
  }
};
