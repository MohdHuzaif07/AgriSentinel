import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import { io } from 'socket.io-client';
import L from 'leaflet';
import { Shield, AlertTriangle, CheckCircle, Activity, Radio, Filter, RefreshCw } from 'lucide-react';

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
  const [hotspots, setHotspots] = useState([]);
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [filterCrop, setFilterCrop] = useState('ALL');
  const [liveAlert, setLiveAlert] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const summaryRes = await axios.get(`${API_URL}/dashboard/summary`, { headers });
      setSummary(summaryRes.data);

      const hotspotsRes = await axios.get(`${API_URL}/dashboard/hotspots`, { headers });
      setHotspots(hotspotsRes.data || []);
    } catch (err) {
      console.warn('Failed to load dashboard metrics from backend', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    const socket = io(SOCKET_URL, {
      reconnectionAttempts: 3,
      timeout: 5000
    });

    socket.on('report:created', (data) => {
      setLiveAlert(`⚡ Real-time Report received: #${data.reportId || 'New'}`);
      setTimeout(() => setLiveAlert(null), 6000);
      fetchDashboardData();
    });

    return () => socket.disconnect();
  }, []);

  const filteredHotspots = hotspots.filter((spot) => {
    if (filterSeverity !== 'ALL' && spot.severity !== filterSeverity) return false;
    if (filterCrop !== 'ALL' && spot.cropType !== filterCrop) return false;
    return true;
  });

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
          <p className="text-slate-500 text-xs mt-0.5">Real-time surveillance of crop disease distribution</p>
        </div>

        <button
          onClick={fetchDashboardData}
          className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Feed
        </button>
      </div>

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
            <p className="text-xs font-medium text-slate-500">High Severity Danger</p>
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
            Showing: {filteredHotspots.length} Markers
          </div>
        </div>
      </div>

      {/* Interactive GIS Map Container */}
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

            {filteredHotspots.map((spot, idx) => {
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

                  {/* Standard Map Marker */}
                  <Marker position={[spot.latitude, spot.longitude]}>
                    <Popup>
                      <div className="p-1 min-w-[160px] text-slate-800">
                        <div className="flex items-center justify-between border-b pb-1 mb-1.5">
                          <strong className="text-sm text-emerald-800">{spot.cropType || 'Crop Scan'}</strong>
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                              isHigh
                                ? 'bg-rose-100 text-rose-800'
                                : isMed
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {spot.severity}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 font-mono">Report ID: {spot.reportId}</p>
                        <p className="text-xs text-slate-600 mt-0.5 font-mono">
                          Coordinates: {spot.latitude?.toFixed(4)}, {spot.longitude?.toFixed(4)}
                        </p>
                      </div>
                    </Popup>
                  </Marker>
                </React.Fragment>
              );
            })}
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default OfficerDashboard;
