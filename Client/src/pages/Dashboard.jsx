import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Map, Activity } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Field Worker Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div 
          onClick={() => navigate('/report')}
          className="bg-white p-6 rounded-xl shadow hover:shadow-md cursor-pointer border-l-4 border-agri flex flex-col items-center justify-center text-center transition"
        >
          <Camera className="w-12 h-12 text-agri mb-3" />
          <h3 className="text-xl font-semibold">New Report</h3>
          <p className="text-gray-500 text-sm mt-1">Capture disease image & GPS</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow border-l-4 border-blue-500 flex flex-col items-center justify-center text-center opacity-75">
          <Activity className="w-12 h-12 text-blue-500 mb-3" />
          <h3 className="text-xl font-semibold">My Reports</h3>
          <p className="text-gray-500 text-sm mt-1">View past submissions</p>
        </div>

        <div 
          onClick={() => navigate('/officer')}
          className="bg-white p-6 rounded-xl shadow hover:shadow-md cursor-pointer border-l-4 border-yellow-500 flex flex-col items-center justify-center text-center transition md:col-span-2"
        >
          <Map className="w-12 h-12 text-yellow-500 mb-3" />
          <h3 className="text-xl font-semibold">Officer Dashboard (GIS)</h3>
          <p className="text-gray-500 text-sm mt-1">View global heatmaps and metrics</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
