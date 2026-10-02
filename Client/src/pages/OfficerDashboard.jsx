import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import { io } from 'socket.io-client';
import L from 'leaflet';
import {
  Shield, AlertTriangle, CheckCircle, Activity, Radio, Filter, RefreshCw,
  Bell, Send, ClipboardList, ChevronDown, ChevronUp, X
} from 'lucide-react';

// Fix Leaflet Default Marker Icons in React/Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
});

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

const OfficerDashboard = () => {
  const [summary, setSummary] = useState({ totalReports: 0, activeCases: 0, highRiskCases: 0, resolvedCases: 0 });
  const [allReports, setAllReports] = useState([]);
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [filterCrop, setFilterCrop] = useState('ALL');
  const [liveAlert, setLiveAlert] = useState(null);
  const [loading, setLoading] = useState(true);

  // Intervention state
  const [selectedReport, setSelectedReport] = useState(null);
  const [recommendation, setRecommendation] = useState('');
  const [officerMedicine, setOfficerMedicine] = useState('');
  const [officerNotes, setOfficerNotes] = useState('');
  const [submittingRec, setSubmittingRec] = useState(false);

  // Alert creation state
  const [showAlertForm, setShowAlertForm] = useState(false);
  const [alertForm, setAlertForm] = useState({
    message: '',
    diseaseType: '',
    severity: 'HIGH',
    centerLat: '15.5',
    centerLng: '78.5',
    radiusKm: '10'
  });
  const [sendingAlert, setSendingAlert] = useState(false);
  const [alertResult, setAlertResult] = useState(null);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [summaryRes, reportsRes] = await Promise.all([
        axios.get(`${API_URL}/dashboard/summary`, { headers }),
        axios.get(`${API_URL}/reports/map`, { headers })
      ]);
      setSummary(summaryRes.data);
      setAllReports(reportsRes.data || []);
    } catch (err) {
      console.warn('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    const socket = io(SOCKET_URL, { reconnectionAttempts: 3, timeout: 5000 });

    socket.on('report:created', (data) => {
      setLiveAlert(`⚡ New report received: #${data.reportId || 'New'}`);
      setTimeout(() => setLiveAlert(null), 6000);
      fetchDashboardData();
    });

    socket.on('report:analyzed', (data) => {
      setLiveAlert(`🌿 AI analysis complete: ${data.disease || 'Disease detected'}`);
      setTimeout(() => setLiveAlert(null), 6000);
      fetchDashboardData();
    });

    socket.on('report:resolved', () => {
      fetchDashboardData();
    });

    return () => socket.disconnect();
  }, []);

  const filteredReports = allReports.filter((r) => {
    if (filterSeverity !== 'ALL' && r.severity !== filterSeverity) return false;
    if (filterCrop !== 'ALL' && r.cropType !== filterCrop) return false;
    return true;
  });

  // Officer submits recommendation for a selected report
  const handleSubmitRecommendation = async () => {
    if (!recommendation.trim()) return alert('Please enter a recommendation');
    setSubmittingRec(true);
    try {
      await axios.patch(
        `${API_URL}/reports/${selectedReport.reportId}/recommend`,
        { officerRecommendation: recommendation, officerMedicine, officerNotes },
        { headers }
      );
      setSelectedReport(null);
      setRecommendation('');
      setOfficerMedicine('');
      setOfficerNotes('');
      fetchDashboardData();
      setLiveAlert('✅ Recommendation saved and farmer notified!');
      setTimeout(() => setLiveAlert(null), 5000);
    } catch (err) {
      alert('Failed to save recommendation: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmittingRec(false);
    }
  };

  // Officer creates regional alert
  const handleSendAlert = async () => {
    if (!alertForm.message.trim()) return alert('Please enter an alert message');
    setSendingAlert(true);
    setAlertResult(null);
    try {
      const res = await axios.post(`${API_URL}/alerts`, {
        ...alertForm,
        centerLat: parseFloat(alertForm.centerLat),
        centerLng: parseFloat(alertForm.centerLng),
        radiusKm: parseFloat(alertForm.radiusKm)
      }, { headers });
      setAlertResult({ success: true, farmers: res.data.affectedFarmers });
      setAlertForm({ message: '', diseaseType: '', severity: 'HIGH', centerLat: '15.5', centerLng: '78.5', radiusKm: '10' });
    } catch (err) {
      setAlertResult({ success: false, error: err.response?.data?.message || err.message });
    } finally {
      setSendingAlert(false);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Live Socket Broadcast Banner */}
      {liveAlert && (
        <div className="bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center justify-between text-xs font-bold animate-bounce">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 animate-pulse" />
            <span>{liveAlert}</span>
          </div>
          <button onClick={() => setLiveAlert(null)} className="text-white/80 hover:text-white">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full w-fit mb-1 border border-emerald-200">
            <Shield className="w-3.5 h-3.5" />
            OFFICER GIS COMMAND STATION
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">Geospatial Decision Support & Hotspots</h2>
          <p className="text-slate-500 text-xs mt-0.5">Real-time surveillance of crop disease distribution across India</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowAlertForm(!showAlertForm)}
            className="flex items-center gap-2 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-semibold transition"
          >
            <Bell className="w-3.5 h-3.5" />
            {showAlertForm ? 'Close Alert' : 'Send Alert'}
          </button>
          <button
            onClick={fetchDashboardData}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Feed
          </button>
        </div>
      </div>

      {/* Alert Creation Panel */}
      {showAlertForm && (
        <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-amber-900 flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Send Regional Crop Disease Alert
            </h3>
            <button onClick={() => setShowAlertForm(false)}><X className="w-4 h-4 text-amber-600" /></button>
          </div>

          {alertResult && (
            <div className={`p-3 rounded-xl text-sm font-medium ${alertResult.success ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
              {alertResult.success
                ? `✅ Alert dispatched to ${alertResult.farmers} farmer(s) in region!`
                : `❌ Failed: ${alertResult.error}`}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-amber-800 mb-1">Alert Message *</label>
              <textarea
                value={alertForm.message}
                onChange={(e) => setAlertForm({ ...alertForm, message: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-amber-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                placeholder="⚠ A crop disease has been detected in your region. Please inspect your crops and follow recommended preventive measures..."
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-amber-800 mb-1">Disease Type (optional)</label>
              <input
                value={alertForm.diseaseType}
                onChange={(e) => setAlertForm({ ...alertForm, diseaseType: e.target.value })}
                className="w-full px-3 py-2 border border-amber-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                placeholder="e.g. Tomato Late Blight"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-amber-800 mb-1">Severity</label>
              <select
                value={alertForm.severity}
                onChange={(e) => setAlertForm({ ...alertForm, severity: e.target.value })}
                className="w-full px-3 py-2 border border-amber-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
              >
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-amber-800 mb-1">Center Latitude</label>
              <input
                type="number" step="any"
                value={alertForm.centerLat}
                onChange={(e) => setAlertForm({ ...alertForm, centerLat: e.target.value })}
                className="w-full px-3 py-2 border border-amber-300 rounded-xl text-sm font-mono focus:outline-none bg-white"
                placeholder="15.5"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-amber-800 mb-1">Center Longitude</label>
              <input
                type="number" step="any"
                value={alertForm.centerLng}
                onChange={(e) => setAlertForm({ ...alertForm, centerLng: e.target.value })}
                className="w-full px-3 py-2 border border-amber-300 rounded-xl text-sm font-mono focus:outline-none bg-white"
                placeholder="78.5"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-amber-800 mb-1">Alert Radius (km)</label>
              <input
                type="number" min="1" max="500"
                value={alertForm.radiusKm}
                onChange={(e) => setAlertForm({ ...alertForm, radiusKm: e.target.value })}
                className="w-full px-3 py-2 border border-amber-300 rounded-xl text-sm font-mono focus:outline-none bg-white"
              />
            </div>
          </div>

          <button
            onClick={handleSendAlert}
            disabled={sendingAlert}
            className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-400 text-white rounded-xl text-sm font-bold transition"
          >
            <Send className="w-4 h-4" />
            {sendingAlert ? 'Dispatching...' : 'Dispatch Alert to Nearby Farmers'}
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Total Scans</p>
            <p className="text-2xl font-black text-slate-800 mt-1">{summary.totalReports}</p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Active Outbreaks</p>
            <p className="text-2xl font-black text-amber-600 mt-1">{summary.activeCases}</p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Radio className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">High Severity</p>
            <p className="text-2xl font-black text-rose-600 mt-1">{summary.highRiskCases}</p>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Resolved Cases</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">{summary.resolvedCases}</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Map Controls & Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2 text-slate-600 font-semibold">
          <Filter className="w-4 h-4 text-emerald-600" />
          <span>GIS Surveillance Filters:</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="text-slate-500 mr-1.5 font-medium">Severity:</label>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50 font-medium"
            >
              <option value="ALL">All Severities</option>
              <option value="HIGH">High Severity</option>
              <option value="MEDIUM">Medium Severity</option>
              <option value="LOW">Low Severity</option>
            </select>
          </div>

          <div>
            <label className="text-slate-500 mr-1.5 font-medium">Crop:</label>
            <select
              value={filterCrop}
              onChange={(e) => setFilterCrop(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50 font-medium"
            >
              <option value="ALL">All Crops</option>
              <option value="Tomato">Tomato</option>
              <option value="Potato">Potato</option>
              <option value="Pepper">Bell Pepper</option>
            </select>
          </div>

          <div className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg font-bold">
            Showing: {filteredReports.length} Markers
          </div>
        </div>
      </div>

      {/* Interactive GIS Map */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="h-[480px] w-full rounded-xl overflow-hidden relative border border-slate-200">
          <MapContainer
            center={[15.5, 78.5]}
            zoom={5}
            style={{ height: '100%', width: '100%' }}
            className="rounded-xl z-0"
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors | AgriSentinel GIS"
            />

            {filteredReports.map((spot, idx) => {
              const isHigh = spot.severity === 'HIGH';
              const isMed = spot.severity === 'MEDIUM';

              return (
                <React.Fragment key={spot._id || spot.reportId || idx}>
                  {/* Danger Proximity Ring for High Severity */}
                  {isHigh && (
                    <CircleMarker
                      center={[spot.latitude, spot.longitude]}
                      radius={22}
                      pathOptions={{
                        color: '#e11d48',
                        fillColor: '#f43f5e',
                        fillOpacity: 0.25,
                        weight: 1.5
                      }}
                    />
                  )}

                  {/* Standard Map Marker with full report info */}
                  <Marker position={[spot.latitude, spot.longitude]}>
                    <Popup>
                      <div className="p-1 min-w-[200px] text-slate-800">
                        <div className="flex items-center justify-between border-b pb-1 mb-2">
                          <strong className="text-sm text-emerald-800">{spot.cropType || 'Crop Scan'}</strong>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                            isHigh ? 'bg-rose-100 text-rose-800'
                            : isMed ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {spot.severity}
                          </span>
                        </div>
                        {spot.disease && (
                          <p className="text-xs text-blue-700 font-semibold mb-1">
                            🌿 {spot.disease.replace(/_/g, ' ')}
                            {spot.confidence && ` (${(spot.confidence * 100).toFixed(1)}%)`}
                          </p>
                        )}
                        <p className="text-xs text-slate-600 font-mono">ID: {spot.reportId}</p>
                        <p className="text-xs text-slate-600 mt-0.5">
                          Status: <span className={spot.status === 'RESOLVED' ? 'text-emerald-600 font-semibold' : 'text-amber-600 font-semibold'}>{spot.status}</span>
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5 font-mono">
                          {spot.latitude?.toFixed(4)}, {spot.longitude?.toFixed(4)}
                        </p>
                        <button
                          onClick={() => setSelectedReport(spot)}
                          className="mt-2 w-full text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1.5 rounded-lg font-bold transition"
                        >
                          Review & Add Recommendation
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                </React.Fragment>
              );
            })}
          </MapContainer>
        </div>
      </div>

      {/* Officer Intervention Panel */}
      {selectedReport && (
        <div className="bg-white border border-cyan-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-cyan-600" />
              Officer Intervention — Report {selectedReport.reportId?.slice(0, 20)}
            </h3>
            <button onClick={() => setSelectedReport(null)} className="text-slate-400 hover:text-slate-700">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs bg-slate-50 rounded-xl p-4">
            <div>
              <span className="text-slate-500">Crop:</span>
              <span className="font-semibold ml-2 text-slate-800">{selectedReport.cropType}</span>
            </div>
            <div>
              <span className="text-slate-500">Severity:</span>
              <span className={`font-semibold ml-2 ${selectedReport.severity === 'HIGH' ? 'text-rose-600' : selectedReport.severity === 'MEDIUM' ? 'text-amber-600' : 'text-emerald-600'}`}>
                {selectedReport.severity}
              </span>
            </div>
            {selectedReport.disease && (
              <div>
                <span className="text-slate-500">AI Diagnosis:</span>
                <span className="font-semibold ml-2 text-blue-700">{selectedReport.disease.replace(/_/g, ' ')}</span>
              </div>
            )}
            <div>
              <span className="text-slate-500">Status:</span>
              <span className="font-semibold ml-2">{selectedReport.status}</span>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Officer Recommendation *
              </label>
              <textarea
                value={recommendation}
                onChange={(e) => setRecommendation(e.target.value)}
                rows={3}
                placeholder="Enter treatment recommendation for the farmer..."
                className="w-full px-3.5 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Recommended Pesticide / Medicine
              </label>
              <input
                value={officerMedicine}
                onChange={(e) => setOfficerMedicine(e.target.value)}
                placeholder="e.g. Copper oxychloride 3g/L, Ridomil Gold 2.5g/L"
                className="w-full px-3.5 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Additional Notes (optional)
              </label>
              <input
                value={officerNotes}
                onChange={(e) => setOfficerNotes(e.target.value)}
                placeholder="Field visit required? Any additional precautions?"
                className="w-full px-3.5 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
              />
            </div>

            <button
              onClick={handleSubmitRecommendation}
              disabled={submittingRec}
              className="flex items-center gap-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-400 text-white rounded-xl text-sm font-bold transition"
            >
              <Send className="w-4 h-4" />
              {submittingRec ? 'Saving...' : 'Save Recommendation & Notify Farmer'}
            </button>
          </div>
        </div>
      )}

      {/* Reports Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800">All Reports — Review & Intervene</h3>
          <span className="text-xs text-slate-500">{allReports.length} total reports</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-left">
                <th className="px-4 py-3 font-semibold">Report ID</th>
                <th className="px-4 py-3 font-semibold">Crop</th>
                <th className="px-4 py-3 font-semibold">Disease (AI)</th>
                <th className="px-4 py-3 font-semibold">Severity</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">GPS</th>
                <th className="px-4 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allReports.slice(0, 20).map((rep) => (
                <tr key={rep.reportId} className="hover:bg-slate-50 transition">
                  <td className="px-4 py-3 font-mono text-[10px] text-slate-600">{rep.reportId?.slice(0, 18)}...</td>
                  <td className="px-4 py-3 font-semibold">{rep.cropType}</td>
                  <td className="px-4 py-3">
                    {rep.disease
                      ? <span className="text-blue-700 font-medium">{rep.disease.replace(/_/g, ' ')}</span>
                      : <span className="text-slate-400 italic">Pending AI</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full font-bold uppercase ${
                      rep.severity === 'HIGH' ? 'bg-rose-100 text-rose-700'
                      : rep.severity === 'MEDIUM' ? 'bg-amber-100 text-amber-700'
                      : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {rep.severity}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-semibold ${
                      rep.status === 'RESOLVED' ? 'text-emerald-600'
                      : rep.status === 'ANALYZED' ? 'text-blue-600'
                      : 'text-amber-600'
                    }`}>
                      {rep.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-[10px] text-slate-500">
                    {rep.latitude?.toFixed(4)}, {rep.longitude?.toFixed(4)}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => {
                        setSelectedReport(rep);
                        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                      }}
                      className="text-cyan-600 hover:text-cyan-800 font-bold hover:underline"
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OfficerDashboard;
