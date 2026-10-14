import React, { useState, useRef } from 'react';
import { Camera, MapPin, Save, CloudUpload, ArrowLeft, Loader2 } from 'lucide-react';
import { saveReportLocally } from '../offline/db.js';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../api/client.js';

// Fast client-side image optimizer: downsizes high-res phone camera shots to 1024px max JPEG
// Reduces upload payloads from 10MB down to ~120KB-180KB (98% reduction)
const compressImage = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const MAX_DIM = 1024;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        // High quality JPEG (0.85) — preserves leaf textures and spots for diagnosis
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        resolve(compressedDataUrl);
      };
      img.onerror = (err) => reject(err);
      img.src = e.target.result;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

const ReportForm = () => {
  const [image, setImage] = useState(null);
  const [cropType, setCropType] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('LOW');
  const [location, setLocation] = useState(null);
  const [manualLocation, setManualLocation] = useState(false);
  const [latInput, setLatInput] = useState('11.0168');
  const [lngInput, setLngInput] = useState('76.9558');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [progressStatus, setProgressStatus] = useState('');
  const [compressing, setCompressing] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleCapture = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        return alert('Please select a valid image file (JPG, PNG, WebP).');
      }
      if (file.size > 20 * 1024 * 1024) {
        return alert('Image file is too large (max 20MB). Please choose a smaller image.');
      }
      try {
        setCompressing(true);
        const optimizedImage = await compressImage(file);
        setImage(optimizedImage);
      } catch (err) {
        console.warn('Image optimization fallback:', err);
        const reader = new FileReader();
        reader.onloadend = () => setImage(reader.result);
        reader.readAsDataURL(file);
      } finally {
        setCompressing(false);
      }
    }
  };

  const getGPS = () => {
    setLoading(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setLatInput(pos.coords.latitude.toFixed(6));
          setLngInput(pos.coords.longitude.toFixed(6));
          setLoading(false);
        },
        (err) => {
          console.warn('Geolocation unavailable:', err.message);
          alert('GPS permission not granted or device location unavailable. You can enter or confirm coordinates manually.');
          setManualLocation(true);
          setLocation({ lat: parseFloat(latInput), lng: parseFloat(lngInput) });
          setLoading(false);
        },
        { timeout: 8000 }
      );
    } else {
      setManualLocation(true);
      setLocation({ lat: parseFloat(latInput), lng: parseFloat(lngInput) });
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image) return alert('Please capture or upload a leaf image');
    if (submitting) return; // Prevent duplicate submissions
    
    const finalLat = location ? location.lat : parseFloat(latInput);
    const finalLng = location ? location.lng : parseFloat(lngInput);

    if (isNaN(finalLat) || isNaN(finalLng)) {
      return alert('Please provide valid latitude and longitude coordinates.');
    }

    setSubmitting(true);
    setProgressStatus('Preparing diagnostic report...');
    const reportId = 'rep_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);

    const report = {
      reportId,
      cropType,
      latitude: finalLat,
      longitude: finalLng,
      description,
      severity,
      imageReference: image,
      createdAt: new Date().toISOString()
    };

    const token = localStorage.getItem('token');

    try {
      if (navigator.onLine && token) {
        setProgressStatus('Uploading to secure cloud storage & AI diagnosis...');
        await axios.post(`${API_URL}/reports`, report, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 25000
        });
        setProgressStatus('Diagnosis queued!');
        alert('✅ Report submitted successfully & queued for AI diagnosis!');
      } else {
        setProgressStatus('Saving offline...');
        await saveReportLocally(report);
        alert('📶 Offline mode: Report saved securely in IndexedDB! It will automatically synchronize when internet returns.');
      }
      navigate('/app/dashboard');
    } catch (err) {
      console.warn('Server upload failed, saving to offline IndexedDB...', err);
      await saveReportLocally(report);
      alert('⚠️ Network request failed. Report stored offline in IndexedDB and queued for auto-sync.');
      navigate('/app/dashboard');
    } finally {
      setSubmitting(false);
      setProgressStatus('');
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-6">
      <button
        onClick={() => navigate('/app/dashboard')}
        className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-emerald-600 font-semibold"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </button>

      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6">
        <div className="border-b border-gray-100 pb-4">
          <h2 className="text-2xl font-bold text-gray-800">New Crop Disease Report</h2>
          <p className="text-gray-500 text-xs mt-1">Capture symptoms for AI-assisted classification & geospatial recording</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Image Capture Box */}
          <div>
            <label className="block text-gray-700 font-semibold text-sm mb-2">Crop Leaf Image *</label>
            <div className="border-2 border-dashed border-emerald-300 bg-emerald-50/40 rounded-2xl p-6 text-center hover:bg-emerald-50/70 transition">
              {image ? (
                <div className="space-y-3">
                  <img src={image} alt="Crop sample" className="max-h-56 mx-auto rounded-xl shadow border border-emerald-200" />
                  <p className="text-xs text-emerald-700 font-medium">Leaf image captured successfully</p>
                </div>
              ) : (
                <div className="flex flex-col items-center text-gray-500 py-4">
                  <div className="p-3 bg-emerald-100 text-emerald-600 rounded-full mb-2">
                    <Camera className="w-8 h-8" />
                  </div>
                  <p className="font-semibold text-gray-700 text-sm">Capture or select crop leaf photo</p>
                  <p className="text-xs text-gray-400 mt-0.5">Supports JPG, PNG (Max 8MB)</p>
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
                className="mt-3 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold shadow-sm transition"
              >
                {image ? 'Retake / Choose Another' : 'Open Camera / Choose Photo'}
              </button>
            </div>
          </div>

          {/* GPS Location Capture */}
          <div>
            <label className="block text-gray-700 font-semibold text-sm mb-1.5">Geospatial Coordinates *</label>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={getGPS}
                className="flex items-center gap-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 active:scale-95 disabled:bg-cyan-400 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                {loading ? 'Locating...' : location ? 'Refresh GPS' : 'Auto-Capture GPS'}
              </button>
              {location && (
                <span className="text-xs text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg flex items-center gap-1">
                  ✓ GPS: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                </span>
              )}
            </div>

            {/* Manual coordinate inputs */}
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-gray-500 mb-0.5">Latitude</label>
                <input
                  type="number"
                  step="any"
                  value={latInput}
                  onChange={(e) => {
                    setLatInput(e.target.value);
                    setLocation({ lat: parseFloat(e.target.value), lng: parseFloat(lngInput) });
                  }}
                  className="w-full px-3 py-1.5 border rounded-lg text-xs font-mono"
                  placeholder="e.g. 11.0168"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] text-gray-500 mb-0.5">Longitude</label>
                <input
                  type="number"
                  step="any"
                  value={lngInput}
                  onChange={(e) => {
                    setLngInput(e.target.value);
                    setLocation({ lat: parseFloat(latInput), lng: parseFloat(e.target.value) });
                  }}
                  className="w-full px-3 py-1.5 border rounded-lg text-xs font-mono"
                  placeholder="e.g. 76.9558"
                  required
                />
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 font-semibold text-sm mb-1">Crop Type *</label>
              <select
                value={cropType}
                onChange={(e) => setCropType(e.target.value)}
                className="w-full px-3.5 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white"
                required
              >
                <option value="">Select Crop...</option>
                <option value="Tomato">Tomato (தக்காளி / टमाटर)</option>
                <option value="Potato">Potato (உருளைக்கிழங்கு / आलू)</option>
                <option value="Pepper">Bell Pepper (குடைமிளகாய் / शिमला मिर्च)</option>
                <option value="Corn">Corn / Maize (மக்காச்சோளம் / मक्का)</option>
                <option value="Rice">Rice / Paddy (நெல் / चावल)</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 font-semibold text-sm mb-1">Estimated Severity</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="w-full px-3.5 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white"
              >
                <option value="LOW">Low (Early / Mild symptoms)</option>
                <option value="MEDIUM">Medium (Visible spreading)</option>
                <option value="HIGH">High (Severe defoliation / necrosis)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-semibold text-sm mb-1">Field Observations / Notes</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="3"
              className="w-full px-3.5 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              placeholder="Describe symptoms (e.g. yellow rings on lower leaves, brown spots, wilting)..."
            />
          </div>

          {progressStatus && (
            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 py-2 px-3 rounded-xl animate-pulse">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>{progressStatus}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || compressing}
            className="w-full flex justify-center items-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] disabled:bg-gray-400 text-white font-bold py-3.5 px-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 text-sm cursor-pointer disabled:cursor-not-allowed"
          >
            {submitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : navigator.onLine ? (
              <CloudUpload className="w-5 h-5" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            {submitting
              ? (progressStatus || 'Submitting...')
              : compressing
              ? 'Optimizing Image...'
              : navigator.onLine
              ? 'Submit for AI Diagnosis & Sync'
              : 'Save Offline to IndexedDB'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReportForm;
