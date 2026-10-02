import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage.jsx';
import Layout from './components/Layout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import ReportForm from './pages/ReportForm.jsx';
import OfficerDashboard from './pages/OfficerDashboard.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';

// ── Protected Route Helpers ──────────────────────────────────────────────────

const getUser = () => {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const isAuthenticated = () => !!localStorage.getItem('token');

/** Redirect to login if not authenticated */
const PrivateRoute = ({ children }) => {
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  return children;
};

/** Only FIELD_WORKER can access */
const FarmerRoute = ({ children }) => {
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  const user = getUser();
  if (user?.role === 'AGRICULTURAL_OFFICER') return <Navigate to="/app/officer" replace />;
  if (user?.role === 'ADMIN') return <Navigate to="/app/admin" replace />;
  return children;
};

/** Only AGRICULTURAL_OFFICER or ADMIN can access */
const OfficerRoute = ({ children }) => {
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  const user = getUser();
  if (user?.role === 'FIELD_WORKER') return <Navigate to="/app/dashboard" replace />;
  if (user?.role === 'ADMIN') return <Navigate to="/app/admin" replace />;
  return children;
};

/** Only ADMIN can access */
const AdminRoute = ({ children }) => {
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  const user = getUser();
  if (user?.role !== 'ADMIN') return <Navigate to="/app/dashboard" replace />;
  return children;
};

// ── App Router ───────────────────────────────────────────────────────────────

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Landing Page */}
        <Route path="/" element={<LandingPage />} />

        {/* Public Authentication Pages */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected App Routes */}
        <Route path="/app" element={<PrivateRoute><Layout /></PrivateRoute>}>
          {/* Default redirect based on role */}
          <Route
            index
            element={
              (() => {
                const user = getUser();
                if (user?.role === 'ADMIN') return <Navigate to="/app/admin" replace />;
                if (user?.role === 'AGRICULTURAL_OFFICER') return <Navigate to="/app/officer" replace />;
                return <Navigate to="/app/dashboard" replace />;
              })()
            }
          />

          {/* Farmer routes */}
          <Route path="dashboard" element={<FarmerRoute><Dashboard /></FarmerRoute>} />
          <Route path="report" element={<FarmerRoute><ReportForm /></FarmerRoute>} />

          {/* Officer routes */}
          <Route path="officer" element={<OfficerRoute><OfficerDashboard /></OfficerRoute>} />

          {/* Admin routes */}
          <Route path="admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;