import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Menu, Wifi, WifiOff } from 'lucide-react';

const Layout = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const navigate = useNavigate();
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Check auth
    if (!localStorage.getItem('token')) {
      navigate('/login');
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-agri-dark text-white p-4 shadow-md flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Menu className="w-6 h-6 cursor-pointer" />
          <h1 className="text-xl font-bold">AgriSentinel</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-sm font-semibold">
            {isOnline ? <span className="flex items-center text-green-300"><Wifi className="w-4 h-4 mr-1"/> Online</span> : <span className="flex items-center text-red-300"><WifiOff className="w-4 h-4 mr-1"/> Offline</span>}
          </div>
        </div>
      </header>
      
      <main className="flex-1 overflow-auto bg-gray-50">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
