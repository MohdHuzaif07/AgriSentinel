import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import { io } from 'socket.io-client';
import L from 'leaflet';

// Fix for leaflet markers in react
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

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        
        const summaryRes = await axios.get(`${API_URL}/dashboard/summary`, { headers });
        setSummary(summaryRes.data);

        const hotspotsRes = await axios.get(`${API_URL}/dashboard/hotspots`, { headers });
        setHotspots(hotspotsRes.data);
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      }
    };

    fetchDashboardData();

    const socket = io(SOCKET_URL);
    socket.on('report:created', (data) => {
      console.log('New report created!', data);
      // Refresh logic or append to state
      fetchDashboardData();
    });

    return () => socket.disconnect();
  }, []);

  return (
    <div className="p-4 md:p-8 space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Officer Dashboard</h2>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow border-l-4 border-blue-500">
          <p className="text-sm text-gray-500">Total Reports</p>
          <p className="text-2xl font-bold">{summary.totalReports}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow border-l-4 border-yellow-500">
          <p className="text-sm text-gray-500">Active Cases</p>
          <p className="text-2xl font-bold">{summary.activeCases}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow border-l-4 border-red-500">
          <p className="text-sm text-gray-500">High Risk</p>
          <p className="text-2xl font-bold">{summary.highRiskCases}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow border-l-4 border-green-500">
          <p className="text-sm text-gray-500">Resolved</p>
          <p className="text-2xl font-bold">{summary.resolvedCases}</p>
        </div>
      </div>

      {/* Map */}
      <div className="bg-white p-4 rounded-xl shadow h-96">
        <h3 className="font-semibold text-lg mb-2">Geospatial Distribution (Hotspots)</h3>
        <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height: '100%', width: '100%' }} className="rounded-lg z-0">
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          {hotspots.map((spot, idx) => (
            <Marker key={idx} position={[spot.latitude, spot.longitude]}>
              <Popup>
                <div>
                  <strong>{spot.cropType}</strong><br/>
                  Severity: {spot.severity}<br/>
                  Report ID: {spot.reportId}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

export default OfficerDashboard;
