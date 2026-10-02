import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Shield, Users, Activity, AlertTriangle, CheckCircle2, Clock, RefreshCw, BarChart3, Bell } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, officersRes] = await Promise.all([
        axios.get(`${API_URL}/admin/stats`, { headers }),
        axios.get(`${API_URL}/admin/officers`, { headers })
      ]);
      setStats(statsRes.data);
      setOfficers(officersRes.data || []);
    } catch (err) {
      console.warn('Failed to load admin data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-64">
        <div className="text-center text-slate-500">
          <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin text-emerald-600" />
          <p className="text-sm">Loading system analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-6 rounded-2xl shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-xs uppercase tracking-widest text-cyan-300 font-bold bg-cyan-950/60 px-2.5 py-1 rounded-full border border-cyan-700/50">
            System Administrator
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold mt-2 flex items-center gap-2">
            <Shield className="w-7 h-7 text-cyan-400" />
            AgriSentinel Admin Console
          </h2>
          <p className="text-slate-300 text-sm mt-1">
            Monitor officer activity, system health, and disease surveillance metrics.
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2.5 rounded-xl text-xs font-semibold transition"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* System KPI Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Total Farmers</p>
              <p className="text-2xl font-black text-slate-800 mt-1">{stats.totalFarmers}</p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Officers</p>
              <p className="text-2xl font-black text-slate-800 mt-1">{stats.totalOfficers}</p>
            </div>
            <div className="p-3 bg-cyan-50 text-cyan-600 rounded-xl">
              <Shield className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Total Reports</p>
              <p className="text-2xl font-black text-slate-800 mt-1">{stats.totalReports}</p>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Activity className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Alerts Sent</p>
              <p className="text-2xl font-black text-amber-600 mt-1">{stats.totalAlerts}</p>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Bell className="w-6 h-6" />
            </div>
          </div>
        </div>
      )}

      {/* Report Status Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-700">Report Status</h3>
              <BarChart3 className="w-4 h-4 text-slate-400" />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-amber-600">
                  <Clock className="w-3.5 h-3.5" />
                  Pending
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-100 rounded-full h-1.5">
                    <div
                      className="bg-amber-400 h-1.5 rounded-full"
                      style={{ width: stats.totalReports ? `${(stats.pendingReports / stats.totalReports) * 100}%` : '0%' }}
                    />
                  </div>
                  <span className="text-xs font-bold text-amber-700 w-6 text-right">{stats.pendingReports}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-blue-600">
                  <Activity className="w-3.5 h-3.5" />
                  Analyzed
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-100 rounded-full h-1.5">
                    <div
                      className="bg-blue-400 h-1.5 rounded-full"
                      style={{ width: stats.totalReports ? `${(stats.analyzedReports / stats.totalReports) * 100}%` : '0%' }}
                    />
                  </div>
                  <span className="text-xs font-bold text-blue-700 w-6 text-right">{stats.analyzedReports}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-emerald-600">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Resolved
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-100 rounded-full h-1.5">
                    <div
                      className="bg-emerald-400 h-1.5 rounded-full"
                      style={{ width: stats.totalReports ? `${(stats.resolvedReports / stats.totalReports) * 100}%` : '0%' }}
                    />
                  </div>
                  <span className="text-xs font-bold text-emerald-700 w-6 text-right">{stats.resolvedReports}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-700">Disease Distribution</h3>
              <AlertTriangle className="w-4 h-4 text-slate-400" />
            </div>
            <div className="space-y-2">
              {(stats.diseaseDistribution || []).slice(0, 5).map((item) => (
                <div key={item._id} className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 truncate max-w-[160px]">
                    {item._id ? item._id.replace(/_/g, ' ') : 'Pending'}
                  </span>
                  <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-full">
                    {item.count}
                  </span>
                </div>
              ))}
              {(!stats.diseaseDistribution || stats.diseaseDistribution.length === 0) && (
                <p className="text-xs text-slate-400 italic">No analyzed reports yet</p>
              )}
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-700">System Health</h3>
              <Activity className="w-4 h-4 text-slate-400" />
            </div>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Reports (last 7 days)</span>
                <span className="font-bold text-emerald-600">{stats.recentReports}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">High Severity Reports</span>
                <span className={`font-bold ${stats.highRiskReports > 5 ? 'text-rose-600' : 'text-amber-600'}`}>
                  {stats.highRiskReports}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Active Farmers</span>
                <span className="font-bold text-slate-700">{stats.totalFarmers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Alerts Dispatched</span>
                <span className="font-bold text-amber-600">{stats.totalAlerts}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Officer Activity Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Shield className="w-4 h-4 text-cyan-600" />
            Agricultural Officers — Activity Monitor
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Reports reviewed and alerts dispatched by each officer</p>
        </div>

        {officers.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-400">
            <Shield className="w-8 h-8 mx-auto mb-2 text-slate-200" />
            <p>No officers registered yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-left text-xs">
                  <th className="px-6 py-3 font-semibold">Officer Name</th>
                  <th className="px-6 py-3 font-semibold">Email</th>
                  <th className="px-6 py-3 font-semibold">Region</th>
                  <th className="px-6 py-3 font-semibold">Reports Reviewed</th>
                  <th className="px-6 py-3 font-semibold">Alerts Sent</th>
                  <th className="px-6 py-3 font-semibold">Alerts (7 days)</th>
                  <th className="px-6 py-3 font-semibold">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {officers.map((officer) => (
                  <tr key={officer._id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4 font-semibold text-slate-800">{officer.name}</td>
                    <td className="px-6 py-4 text-slate-500 text-xs">{officer.email}</td>
                    <td className="px-6 py-4">
                      <span className="bg-cyan-50 text-cyan-700 px-2 py-0.5 rounded-full text-xs font-medium">
                        {officer.region || 'Unassigned'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-bold ${officer.reportsReviewed > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {officer.reportsReviewed}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-bold ${officer.alertsSent > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                        {officer.alertsSent}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                        officer.recentAlerts > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {officer.recentAlerts} this week
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs">
                      {new Date(officer.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
