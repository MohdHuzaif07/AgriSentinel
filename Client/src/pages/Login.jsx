import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import axios from 'axios';
import ThemeToggle from '../components/ThemeToggle.jsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      const { token, user } = res.data;

      // Store token and user info
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      // Route based on role
      if (user.role === 'ADMIN') {
        navigate('/app/admin');
      } else if (user.role === 'AGRICULTURAL_OFFICER') {
        navigate('/app/officer');
      } else {
        navigate('/app/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials or register an account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4 py-8 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-700 transition-colors duration-200">
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-extrabold text-2xl group">
            <span className="transition-transform group-hover:scale-110">🌿</span> AgriSentinel
          </Link>
          <h2 className="text-xl font-bold text-gray-800 dark:text-slate-100 mt-2">Welcome Back</h2>
          <p className="text-gray-500 dark:text-slate-400 text-sm">Sign in to access your crop monitoring portal</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800/60 rounded-lg text-red-700 dark:text-red-300 text-sm font-medium">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-gray-700 dark:text-slate-300 font-medium mb-1 text-sm">Email Address</label>
            <input
              type="email"
              className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 transition-colors"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="farmer@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 dark:text-slate-300 font-medium mb-1 text-sm">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                className="w-full px-3.5 py-2.5 pr-11 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 transition-colors"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="password123"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-slate-400 dark:hover:text-slate-200 transition focus:outline-none p-1 rounded cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 text-sm flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-gray-100 dark:border-slate-700 text-center text-sm text-gray-600 dark:text-slate-400">
          Don't have an account?{' '}
          <Link to="/register" className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline">
            Register now
          </Link>
        </div>

        <div className="mt-4 p-3.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-gray-600 dark:text-slate-400 space-y-1.5">
          <p className="font-bold text-gray-700 dark:text-slate-200">Demo Credentials (after seeding DB):</p>
          <div className="flex justify-between items-center py-0.5">
            <span>🌾 Field Worker:</span>
            <code className="bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-800 dark:text-slate-200">farmer@example.com / password123</code>
          </div>
          <div className="flex justify-between items-center py-0.5">
            <span>🗺️ Officer:</span>
            <code className="bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-800 dark:text-slate-200">officer@example.com / password123</code>
          </div>
          <div className="flex justify-between items-center py-0.5">
            <span>⚙️ Admin:</span>
            <code className="bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-800 dark:text-slate-200">admin@example.com / password123</code>
          </div>
        </div>

        <div className="mt-4 text-center">
          <Link to="/" className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-slate-300">
            ← Back to Landing Page
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
