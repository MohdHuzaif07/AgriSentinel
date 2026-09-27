import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Map, Activity, RefreshCw, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Dashboard = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const { t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    const rawUser = localStorage.getItem('user');
    if (rawUser) {
      try {
        setUser(JSON.parse(rawUser));
      } catch (e) {}
    }
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await axios.get(`${API_URL}/reports`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReports(res.data || []);
    } catch (err) {
      console.warn('Could not fetch server reports, may be offline', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-slate-900 text-white p-6 rounded-2xl shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-xs uppercase tracking-widest text-emerald-300 font-bold bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-700/50">
            {user?.role === 'AGRICULTURAL_OFFICER' ? 'Agricultural Officer Portal' : 'Field Worker Station'}
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold mt-2">
            {t('welcome', 'Welcome to AgriSentinel')}, {user?.name || 'Farmer'}
          </h2>
          <p className="text-slate-300 text-sm mt-1">
            Offline-first crop disease monitoring and geospatial decision support.
          </p>
        </div>

        <button
          onClick={() => navigate('/app/report')}
          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-3 rounded-xl shadow-md flex items-center gap-2 transition duration-200"
        >
          <Camera className="w-5 h-5" />
          {t('new_report', 'Create New Report')}
        </button>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div
          onClick={() => navigate('/app/report')}
          className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md border border-slate-200/80 cursor-pointer flex flex-col justify-between transition group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition">
              <Camera className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Active</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">{t('new_report', 'New Crop Report')}</h3>
            <p className="text-gray-500 text-xs mt-1">Capture leaf images & GPS coordinates even without internet.</p>
          </div>
        </div>

        <div
          onClick={() => navigate('/app/officer')}
          className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md border border-slate-200/80 cursor-pointer flex flex-col justify-between transition group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-cyan-50 text-cyan-600 rounded-xl group-hover:bg-cyan-600 group-hover:text-white transition">
              <Map className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded-full">GIS</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">GIS Command Map</h3>
            <p className="text-gray-500 text-xs mt-1">View geospatial distribution, danger heatmaps, and outbreak clusters.</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Activity className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {reports.length} Total
            </span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">Total Scans Submitted</h3>
            <p className="text-gray-500 text-xs mt-1">Synced with secure centralized knowledge database.</p>
          </div>
        </div>
      </div>

      {/* Reports History List */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex justify-between items-center mb-5 pb-3 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-bold text-gray-800">{t('my_reports', 'Recent Crop Reports')}</h3>
            <p className="text-xs text-gray-500">Live feed of processed diagnostic scans</p>
          </div>
          <button
            onClick={fetchReports}
            className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-emerald-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="py-8 text-center text-sm text-gray-500">Loading reports...</div>
        ) : reports.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <Camera className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            <p className="font-medium text-gray-600">No reports submitted yet.</p>
            <p className="text-xs text-gray-400 mt-1">Click "Create New Report" to scan your first crop leaf.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {reports.map((rep) => (
              <div key={rep.reportId} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center border">
                    {rep.imageReference && rep.imageReference.startsWith('data:image') ? (
                      <img src={rep.imageReference} alt="Crop" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl">🌿</span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-800 text-sm">{rep.cropType}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          rep.severity === 'HIGH'
                            ? 'bg-rose-100 text-rose-700'
                            : rep.severity === 'MEDIUM'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {rep.severity} Severity
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      ID: <code className="text-slate-700">{rep.reportId}</code> · GPS: {rep.latitude?.toFixed(4)}, {rep.longitude?.toFixed(4)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1 text-slate-500">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(rep.createdAt).toLocaleDateString()}
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full font-semibold flex items-center gap-1 ${
                      rep.status === 'RESOLVED'
                        ? 'bg-emerald-50 text-emerald-700'
                        : rep.status === 'ANALYZED'
                        ? 'bg-blue-50 text-blue-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {rep.status === 'RESOLVED' ? (
                      <CheckCircle2 className="w-3 h-3" />
                    ) : rep.status === 'ANALYZED' ? (
                      <CheckCircle2 className="w-3 h-3" />
                    ) : (
                      <Clock className="w-3 h-3" />
                    )}
                    {rep.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
