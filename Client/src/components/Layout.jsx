import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { Wifi, WifiOff, LogOut, Globe, Home, Camera, Map, User, Shield, Bell } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { syncPendingReports } from '../offline/syncManager.js';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

const Layout = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [user, setUser] = useState(null);
  const [pendingAlerts, setPendingAlerts] = useState([]);
  const [showAlertBanner, setShowAlertBanner] = useState(null);
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const rawUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!token) {
      navigate('/login');
      return;
    }

    let parsedUser = null;
    if (rawUser) {
      try {
        parsedUser = JSON.parse(rawUser);
        setUser(parsedUser);
      } catch (e) {
        setUser(null);
      }
    }

    // Sync pending reports on initial mount if already online
    if (navigator.onLine && token) {
      syncPendingReports(token);
    }

    const handleOnline = () => {
      setIsOnline(true);
      if (token) {
        syncPendingReports(token);
      }
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Socket.IO setup for real-time alerts and results
    const socket = io(SOCKET_URL, {
      reconnectionAttempts: 5,
      timeout: 5000
    });

    socket.on('connect', () => {
      // Join farmer's personal room for targeted alerts
      if (parsedUser?.id) {
        socket.emit('join:farmer', parsedUser.id);
      }
    });

    // Listen for regional alerts targeted to this farmer
    if (parsedUser?.id && parsedUser?.role === 'FIELD_WORKER') {
      socket.on(`alert:farmer:${parsedUser.id}`, (alertData) => {
        setShowAlertBanner(alertData);
        setPendingAlerts(prev => [alertData, ...prev].slice(0, 5));
      });

      // Listen for ML result notification
      socket.on(`report:result:${parsedUser.id}`, (result) => {
        setShowAlertBanner({
          title: '🌿 AI Diagnosis Complete',
          message: `Disease detected: ${result.disease} (${(result.confidence * 100).toFixed(1)}% confidence). Check your reports for treatment details.`,
          severity: 'LOW'
        });
      });

      // Listen for officer resolution
      socket.on(`report:resolved:${parsedUser.id}`, (data) => {
        setShowAlertBanner({
          title: '✅ Officer Reviewed Your Report',
          message: data.officerRecommendation || 'An agricultural officer has reviewed your report.',
          severity: 'LOW'
        });
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      socket.disconnect();
    };
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const handleLanguageChange = (e) => {
    i18n.changeLanguage(e.target.value);
  };

  const isOfficerOrAdmin = user?.role === 'AGRICULTURAL_OFFICER' || user?.role === 'ADMIN';
  const isAdmin = user?.role === 'ADMIN';
  const isFarmer = user?.role === 'FIELD_WORKER';

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      {/* Top App Header */}
      <header className="bg-slate-900 text-white px-4 md:px-8 py-3.5 shadow-md flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2 group">
            <span className="text-2xl">🌿</span>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              AgriSentinel
            </span>
          </Link>

          {/* Role-based Navigation Links */}
          <nav className="hidden md:flex items-center gap-2">
            {/* Farmer-only links */}
            {isFarmer && (
              <>
                <Link
                  to="/app/dashboard"
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition ${
                    location.pathname === '/app/dashboard'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Home className="w-4 h-4" />
                  {t('dashboard', 'Dashboard')}
                </Link>

                <Link
                  to="/app/report"
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition ${
                    location.pathname === '/app/report'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Camera className="w-4 h-4" />
                  {t('new_report', 'New Report')}
                </Link>
              </>
            )}

            {/* Officer-only links */}
            {isOfficerOrAdmin && !isAdmin && (
              <Link
                to="/app/officer"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition ${
                  location.pathname === '/app/officer'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Map className="w-4 h-4" />
                GIS Map
              </Link>
            )}

            {/* Admin links */}
            {isAdmin && (
              <Link
                to="/app/admin"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition ${
                  location.pathname === '/app/admin'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Shield className="w-4 h-4" />
                Admin
              </Link>
            )}
          </nav>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {/* Online/Offline Status Indicator */}
          <div className="flex items-center text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700">
            {isOnline ? (
              <span className="flex items-center text-emerald-400 gap-1">
                <Wifi className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Online</span>
              </span>
            ) : (
              <span className="flex items-center text-amber-400 gap-1 animate-pulse">
                <WifiOff className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Offline (IDB Active)</span>
              </span>
            )}
          </div>

          {/* Alert Bell (farmer only) */}
          {isFarmer && pendingAlerts.length > 0 && (
            <div className="relative">
              <button
                className="flex items-center gap-1 text-xs text-amber-300 bg-amber-950/40 border border-amber-800/50 px-2.5 py-1.5 rounded-lg"
                onClick={() => setShowAlertBanner(pendingAlerts[0])}
              >
                <Bell className="w-3.5 h-3.5 animate-pulse" />
                <span className="font-bold">{pendingAlerts.length}</span>
              </button>
            </div>
          )}

          {/* Language Selector */}
          <div className="flex items-center gap-1 text-slate-300 text-xs bg-slate-800 px-2 py-1 rounded-lg border border-slate-700">
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={i18n.language || 'en'}
              onChange={handleLanguageChange}
              className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer"
            >
              <option value="en" className="bg-slate-800 text-white">EN</option>
              <option value="ta" className="bg-slate-800 text-white">தமிழ்</option>
              <option value="hi" className="bg-slate-800 text-white">हिन्दी</option>
            </select>
          </div>

          {/* User Role Tag */}
          {user && (
            <div className="hidden lg:flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700 text-xs text-slate-300">
              <User className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-medium max-w-[120px] truncate">{user.name || user.email}</span>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-1.5 py-0.5 rounded uppercase font-bold">
                {user.role === 'AGRICULTURAL_OFFICER' ? 'Officer' : user.role === 'ADMIN' ? 'Admin' : 'Farmer'}
              </span>
            </div>
          )}

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            title="Sign Out"
            className="flex items-center gap-1 text-xs text-rose-300 hover:text-white bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 px-2.5 py-1.5 rounded-lg transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Real-time Alert Banner */}
      {showAlertBanner && (
        <div className={`px-4 py-3 flex items-center justify-between text-sm font-medium shadow-lg z-40 ${
          showAlertBanner.severity === 'HIGH' || showAlertBanner.severity === 'MEDIUM'
            ? 'bg-amber-500 text-amber-950'
            : 'bg-emerald-600 text-white'
        }`}>
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 flex-shrink-0" />
            <div>
              <span className="font-bold mr-2">{showAlertBanner.title || '⚠ Alert'}:</span>
              <span>{showAlertBanner.message}</span>
            </div>
          </div>
          <button
            onClick={() => {
              setShowAlertBanner(null);
              setPendingAlerts(prev => prev.slice(1));
            }}
            className="ml-4 text-current opacity-70 hover:opacity-100 font-bold text-lg leading-none"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
