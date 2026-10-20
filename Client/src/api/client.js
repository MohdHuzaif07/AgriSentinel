import axios from 'axios';

// Centralized API configuration:
// - In production: uses VITE_API_URL if configured and valid, otherwise defaults to '/api' (same-origin on Vercel)
// - In development: uses VITE_API_URL if configured, otherwise defaults to 'http://localhost:5000/api'
const rawApiUrl = import.meta.env.VITE_API_URL?.trim();
export const API_URL =
  (rawApiUrl && !rawApiUrl.includes('your-server-url') && !rawApiUrl.includes('example.com'))
    ? rawApiUrl
    : (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api');

const rawSocketUrl = import.meta.env.VITE_SOCKET_URL?.trim();
export const SOCKET_URL =
  (rawSocketUrl && !rawSocketUrl.includes('your-server-url') && !rawSocketUrl.includes('example.com'))
    ? rawSocketUrl
    : (import.meta.env.DEV ? 'http://localhost:5000' : (typeof window !== 'undefined' ? window.location.origin : ''));

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
