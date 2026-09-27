import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { Wifi, WifiOff, LogOut, Globe, Home, Camera, Map, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { syncPendingReports } from '../offline/syncManager.js';

const Layout = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [user, setUser] = useState(null);
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

    if (rawUser) {
      try {
        setUser(JSON.parse(rawUser));
      } catch (e) {
        setUser(null);
      }
    }

    const handleOnline = () => {
      setIsOnline(true);
      // Auto-trigger sync queue on reconnect
      if (token) {
        syncPendingReports(token);
      }
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
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

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-2">
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
          </nav>
        </div>

        {/* Right Section: Status, Lang, Profile, Logout */}
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
                {user.role === 'AGRICULTURAL_OFFICER' ? 'Officer' : 'Field Worker'}
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

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
