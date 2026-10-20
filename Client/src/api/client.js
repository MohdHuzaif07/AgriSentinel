import axios from 'axios';

// Centralized API configuration:
// - In production (PROD): always use same-origin '/api' unless a valid external HTTPS URL is explicitly provided
// - In development (DEV): default to 'http://localhost:5000/api'
const rawApiUrl = import.meta.env.VITE_API_URL?.trim();

export const API_URL = (() => {
  if (import.meta.env.PROD) {
    if (rawApiUrl && rawApiUrl.startsWith('https://') && !rawApiUrl.includes('your-server-url') && !rawApiUrl.includes('example.com') && !rawApiUrl.includes('localhost')) {
      return rawApiUrl;
    }
    return '/api';
  }
  return rawApiUrl || 'http://localhost:5000/api';
})();

const rawSocketUrl = import.meta.env.VITE_SOCKET_URL?.trim();
export const SOCKET_URL = (() => {
  if (import.meta.env.PROD) {
    if (rawSocketUrl && rawSocketUrl.startsWith('https://') && !rawSocketUrl.includes('your-server-url') && !rawSocketUrl.includes('example.com') && !rawSocketUrl.includes('localhost')) {
      return rawSocketUrl;
    }
    return typeof window !== 'undefined' ? window.location.origin : '';
  }
  return rawSocketUrl || 'http://localhost:5000';
})();

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default apiClient;
