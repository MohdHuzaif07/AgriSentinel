import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera, Activity, RefreshCw, AlertTriangle, CheckCircle2, Clock,
  Leaf, Beaker, ShieldCheck, Bell, WifiOff, CloudUpload
} from 'lucide-react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { getPendingSyncReports } from '../offline/db.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Dashboard = () => {
  const [reports, setReports] = useState([]);
  const [offlineReports, setOfflineReports] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [expandedReport, setExpandedReport] = useState(null);
  const { t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    const rawUser = localStorage.getItem('user');
    if (rawUser) {
      try { setUser(JSON.parse(rawUser)); } catch (e) {}
    }
    fetchReports();
    fetchAlerts();
    loadOfflineReports();
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

  const fetchAlerts = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await axios.get(`${API_URL}/alerts/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAlerts(res.data || []);
    } catch (err) {
      // Silently fail — alerts are bonus feature
    }
  };

  const loadOfflineReports = async () => {
    try {
      const pending = await getPendingSyncReports();
      setOfflineReports(pending || []);
    } catch (e) {
      setOfflineReports([]);
    }
  };

  const severityColor = (severity) =>
    severity === 'HIGH' ? 'bg-rose-100 text-rose-700'
    : severity === 'MEDIUM' ? 'bg-amber-100 text-amber-700'
    : 'bg-emerald-100 text-emerald-700';

  const statusColor = (status) =>
    status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-700'
    : status === 'ANALYZED' ? 'bg-blue-50 text-blue-700'
    : 'bg-amber-50 text-amber-700';

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-slate-900 text-white p-6 rounded-2xl shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-xs uppercase tracking-widest text-emerald-300 font-bold bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-700/50">
            Field Worker Station
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold mt-2">
            {t('welcome', 'Welcome to AgriSentinel')}, {user?.name || 'Farmer'}
          </h2>
          <p className="text-slate-300 text-sm mt-1">
            Offline-first crop disease monitoring and AI-assisted diagnosis.
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

      {/* Regional Alerts from Officers */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.slice(0, 3).map((alert) => (
            <div
              key={alert._id}
              className={`p-4 rounded-xl border flex items-start gap-3 ${
                alert.severity === 'HIGH'
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : alert.severity === 'MEDIUM'
                  ? 'bg-amber-50 border-amber-200 text-amber-800'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}
            >
              <Bell className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm">{alert.title}</p>
                <p className="text-xs mt-0.5">{alert.message}</p>
                <p className="text-[10px] mt-1 opacity-70">
                  From: {alert.officerName} · {new Date(alert.createdAt).toLocaleDateString()}
                </p>
              </div>
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full flex-shrink-0 ${
                alert.severity === 'HIGH' ? 'bg-rose-200 text-rose-800'
                : alert.severity === 'MEDIUM' ? 'bg-amber-200 text-amber-800'
                : 'bg-emerald-200 text-emerald-800'
              }`}>
                {alert.severity}
              </span>
            </div>
          ))}
        </div>
      )}

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

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Activity className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {reports.length} Synced
            </span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">Total Scans Submitted</h3>
            <p className="text-gray-500 text-xs mt-1">Synced with AI diagnostic database.</p>
          </div>
        </div>

        {/* Offline Pending Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-xl ${offlineReports.length > 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400'}`}>
              {offlineReports.length > 0 ? <WifiOff className="w-6 h-6" /> : <CloudUpload className="w-6 h-6" />}
            </div>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              offlineReports.length > 0 ? 'text-amber-600 bg-amber-50' : 'text-slate-500 bg-slate-100'
            }`}>
              {offlineReports.length} Pending
            </span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">Offline Queue</h3>
            <p className="text-gray-500 text-xs mt-1">
              {offlineReports.length > 0
                ? 'Reports saved offline. Will sync automatically when internet returns.'
                : 'No pending offline reports.'}
            </p>
          </div>
        </div>
      </div>

      {/* Offline Pending Reports (IndexedDB) */}
      {offlineReports.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl">
          <div className="flex items-center gap-2 mb-3">
            <WifiOff className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-bold text-amber-800">
              {offlineReports.length} Report{offlineReports.length > 1 ? 's' : ''} Saved Offline
            </h3>
            <span className="text-xs text-amber-600 ml-auto">Auto-syncs when online</span>
          </div>
          <div className="space-y-2">
            {offlineReports.map((rep) => (
              <div key={rep.reportId} className="bg-white border border-amber-100 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🌿</span>
                  <div>
                    <span className="font-semibold text-gray-700">{rep.cropType}</span>
                    <span className="text-gray-400 ml-2">GPS: {rep.latitude?.toFixed(4)}, {rep.longitude?.toFixed(4)}</span>
                  </div>
                </div>
                <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold uppercase text-[10px]">
                  Offline Pending
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

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
              <div key={rep.reportId}>
                {/* Report Row */}
                <div
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-slate-50 -mx-2 px-2 rounded-lg transition"
                  onClick={() => setExpandedReport(expandedReport === rep.reportId ? null : rep.reportId)}
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center border">
                      {rep.imageReference && rep.imageReference.startsWith('data:image') ? (
                        <img src={rep.imageReference} alt="Crop" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xl">🌿</span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-gray-800 text-sm">{rep.cropType}</span>
                        {rep.disease && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-100 text-blue-700">
                            {rep.disease.replace(/_/g, ' ')}
                          </span>
                        )}
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${severityColor(rep.severity)}`}>
                          {rep.severity}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        ID: <code className="text-slate-700">{rep.reportId?.slice(0, 20)}...</code>
                        {rep.latitude && ` · GPS: ${rep.latitude.toFixed(4)}, ${rep.longitude?.toFixed(4)}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs flex-shrink-0">
                    {rep.confidence && (
                      <span className="text-slate-500 font-mono text-[11px]">
                        {(rep.confidence * 100).toFixed(1)}% conf
                      </span>
                    )}
                    <div className="flex items-center gap-1 text-slate-500">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(rep.createdAt).toLocaleDateString()}
                    </div>
                    <span className={`px-2.5 py-1 rounded-full font-semibold flex items-center gap-1 ${statusColor(rep.status)}`}>
                      {rep.status === 'RESOLVED' ? <CheckCircle2 className="w-3 h-3" />
                        : rep.status === 'ANALYZED' ? <CheckCircle2 className="w-3 h-3" />
                        : <Clock className="w-3 h-3" />}
                      {rep.status}
                    </span>
                  </div>
                </div>

                {/* Expanded Detail Panel */}
                {expandedReport === rep.reportId && (
                  <div className="mb-3 mx-2 bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3 text-sm">
                    {/* AI Diagnosis */}
                    {rep.disease ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-blue-700 font-bold text-xs uppercase tracking-wide">
                          <Leaf className="w-4 h-4" />
                          AI Diagnosis
                          {rep.isMock && <span className="text-[9px] bg-blue-100 px-1.5 py-0.5 rounded font-medium">DEMO MODE</span>}
                        </div>
                        <p className="font-semibold text-gray-800">{rep.disease.replace(/_/g, ' ')}</p>
                        {rep.confidence && (
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-500 h-2 rounded-full"
                                style={{ width: `${(rep.confidence * 100).toFixed(0)}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-600 font-mono">{(rep.confidence * 100).toFixed(1)}%</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-amber-600 text-xs flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        AI analysis in progress or pending queue...
                      </div>
                    )}

                    {/* Treatment */}
                    {rep.treatment && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-wide">
                          <Beaker className="w-4 h-4" />
                          Treatment Advice
                        </div>
                        <p className="text-gray-700 text-xs leading-relaxed">{rep.treatment}</p>
                      </div>
                    )}

                    {/* Medicine */}
                    {rep.medicine && (
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-rose-700 uppercase tracking-wide">
                          💊 Medicine / Pesticide
                        </p>
                        <p className="text-gray-700 text-xs leading-relaxed">{rep.medicine}</p>
                      </div>
                    )}

                    {/* Prevention */}
                    {rep.prevention && (
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-teal-700 uppercase tracking-wide">
                          🛡️ Prevention
                        </p>
                        <p className="text-gray-700 text-xs leading-relaxed">{rep.prevention}</p>
                      </div>
                    )}

                    {/* Officer Recommendation */}
                    {rep.officerRecommendation && (
                      <div className="space-y-1 border-t border-slate-200 pt-2">
                        <div className="flex items-center gap-2 text-cyan-700 font-bold text-xs uppercase tracking-wide">
                          <ShieldCheck className="w-4 h-4" />
                          Officer Recommendation
                        </div>
                        <p className="text-gray-700 text-xs leading-relaxed">{rep.officerRecommendation}</p>
                        {rep.officerMedicine && (
                          <p className="text-xs text-cyan-800">
                            <span className="font-semibold">Recommended Medicine:</span> {rep.officerMedicine}
                          </p>
                        )}
                        {rep.officerNotes && (
                          <p className="text-xs text-gray-600 italic">{rep.officerNotes}</p>
                        )}
                      </div>
                    )}

                    {/* Field notes */}
                    {rep.description && (
                      <div className="border-t border-slate-200 pt-2">
                        <p className="text-xs text-gray-500"><span className="font-semibold">Field Notes:</span> {rep.description}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
