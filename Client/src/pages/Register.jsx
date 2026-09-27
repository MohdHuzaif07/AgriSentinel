import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'FIELD_WORKER',
    preferredLanguage: 'en',
    region: 'North Zone'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }

    if (formData.password.length < 6) {
      return setError('Password must be at least 6 characters');
    }

    setLoading(true);

    try {
      await axios.post(`${API_URL}/auth/register`, {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        preferredLanguage: formData.preferredLanguage,
        region: formData.region
      });

      setSuccess('Account created successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4 py-8">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200">
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2 text-agri-dark font-extrabold text-2xl">
            <span>🌿</span> AgriSentinel
          </Link>
          <h2 className="text-xl font-bold text-gray-800 mt-2">Create an Account</h2>
          <p className="text-gray-500 text-sm">Join the crop disease monitoring network</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm font-medium">
            ⚠️ {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm font-medium">
            ✅ {success}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">Full Name</label>
            <input
              type="text"
              name="name"
              required
              className="w-full px-3.5 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              placeholder="e.g. Ramesh Kumar"
              value={formData.name}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">Email Address</label>
            <input
              type="email"
              name="email"
              required
              className="w-full px-3.5 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              placeholder="farmer@example.com"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1">Password</label>
              <input
                type="password"
                name="password"
                required
                className="w-full px-3.5 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                required
                className="w-full px-3.5 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1">User Role</label>
              <select
                name="role"
                className="w-full px-3.5 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white"
                value={formData.role}
                onChange={handleChange}
              >
                <option value="FIELD_WORKER">🌾 Field Worker / Farmer</option>
                <option value="AGRICULTURAL_OFFICER">🗺️ Agricultural Officer</option>
                <option value="ADMIN">⚙️ System Administrator</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1">Preferred Language</label>
              <select
                name="preferredLanguage"
                className="w-full px-3.5 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white"
                value={formData.preferredLanguage}
                onChange={handleChange}
              >
                <option value="en">English</option>
                <option value="ta">தமிழ் (Tamil)</option>
                <option value="hi">हिन्दी (Hindi)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">Region / District</label>
            <input
              type="text"
              name="region"
              className="w-full px-3.5 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              placeholder="e.g. Coimbatore, Tamil Nadu"
              value={formData.region}
              onChange={handleChange}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-lg shadow-md transition duration-200 mt-2 text-sm"
          >
            {loading ? 'Creating Account...' : 'Complete Sign Up'}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-gray-100 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-emerald-600 font-bold hover:underline">
            Sign In here
          </Link>
        </div>

        <div className="mt-2 text-center">
          <Link to="/" className="text-xs text-gray-400 hover:text-gray-600">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
