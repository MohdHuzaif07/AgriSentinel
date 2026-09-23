import React, { useState, useRef } from 'react';
import { Camera, MapPin, Save, CloudUpload } from 'lucide-react';
import { saveReportLocally } from '../offline/db.js';
import { useNavigate } from 'react-router-dom';

const ReportForm = () => {
  const [image, setImage] = useState(null);
  const [cropType, setCropType] = useState('');
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleCapture = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const getGPS = () => {
    setLoading(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setLoading(false);
        },
        (err) => {
          console.error(err);
          alert('GPS permission denied or unavailable.');
          setLoading(false);
        }
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image) return alert('Please capture an image');
    if (!location) return alert('Please capture GPS location');
    
    const reportId = 'rep_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    
    const report = {
      reportId,
      cropType,
      latitude: location.lat,
      longitude: location.lng,
      imageReference: image, // Storing base64 for offline prototype
      createdAt: new Date().toISOString()
    };

    try {
      await saveReportLocally(report);
      alert(navigator.onLine ? 'Report queued for sync.' : 'Saved Offline. Will sync when connected.');
      navigate('/');
    } catch (err) {
      console.error(err);
      alert('Failed to save report.');
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-6 bg-white my-4 rounded-xl shadow">
      <h2 className="text-2xl font-bold text-gray-800 border-b pb-4">New Crop Report</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Image Capture */}
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
          {image ? (
            <img src={image} alt="Crop" className="max-h-64 mx-auto rounded" />
          ) : (
            <div className="flex flex-col items-center text-gray-500">
              <Camera className="w-12 h-12 mb-2 text-agri" />
              <p>Capture or upload image</p>
            </div>
          )}
          <input 
            type="file" 
            accept="image/*" 
            capture="environment" 
            ref={fileInputRef}
            onChange={handleCapture}
            className="hidden" 
          />
          <button 
            type="button" 
            onClick={() => fileInputRef.current?.click()}
            className="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded font-medium"
          >
            {image ? 'Retake Photo' : 'Open Camera'}
          </button>
        </div>

        {/* GPS Capture */}
        <div>
          <label className="block text-gray-700 font-medium mb-2">Location</label>
          <div className="flex items-center gap-4">
            <button 
              type="button" 
              onClick={getGPS}
              className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded font-medium"
              disabled={loading}
            >
              <MapPin className="w-5 h-5" />
              {loading ? 'Locating...' : 'Get GPS'}
            </button>
            {location && <span className="text-sm text-green-600 font-medium">Captured ✓</span>}
          </div>
        </div>

        {/* Form Fields */}
        <div>
          <label className="block text-gray-700 font-medium mb-1">Crop Type</label>
          <select 
            value={cropType} 
            onChange={(e) => setCropType(e.target.value)} 
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-agri"
            required
          >
            <option value="">Select Crop...</option>
            <option value="Tomato">Tomato</option>
            <option value="Potato">Potato</option>
            <option value="Pepper">Bell Pepper</option>
          </select>
        </div>

        <button 
          type="submit" 
          className="w-full flex justify-center items-center gap-2 bg-agri hover:bg-agri-dark text-white font-bold py-3 px-4 rounded-lg transition"
        >
          {navigator.onLine ? <CloudUpload className="w-5 h-5" /> : <Save className="w-5 h-5" />}
          {navigator.onLine ? 'Submit & Sync' : 'Save Offline'}
        </button>
      </form>
    </div>
  );
};

export default ReportForm;
