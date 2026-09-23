import { openDB } from 'idb';

const DB_NAME = 'AgriSentinelDB';
const DB_VERSION = 1;

export const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('reports')) {
        db.createObjectStore('reports', { keyPath: 'reportId' });
      }
      if (!db.objectStoreNames.contains('syncQueue')) {
        db.createObjectStore('syncQueue', { keyPath: 'reportId' });
      }
    },
  });
};

export const saveReportLocally = async (report) => {
  const db = await initDB();
  await db.put('reports', report);
  await db.put('syncQueue', report);
};

export const getPendingSyncReports = async () => {
  const db = await initDB();
  return db.getAll('syncQueue');
};

export const removeSyncedReport = async (reportId) => {
  const db = await initDB();
  await db.delete('syncQueue', reportId);
};
