import axios from 'axios';
import { API_BASE_URL, USE_MOCK } from '../constants/config';
import { storage } from './storage';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Mock Data for Testing
const MOCK_REFERRALS = [
  { id: '1', specialty: 'Cardiology', patientPhone: '+91 9988776655', date: new Date().toISOString(), status: 'pending' },
  { id: '2', specialty: 'Neurology', patientPhone: '+1 2025550123', date: new Date(Date.now() - 86400000).toISOString(), status: 'approved' },
];

// Request Interceptor
api.interceptors.request.use(async (config) => {
  if (USE_MOCK) {
    if (config.url === '/api/auth/login') {
      config.adapter = async () => ({
        data: { token: 'mock_jwt_token', user: { id: 'gp_123', name: 'Dr. Smith' } },
        status: 200, statusText: 'OK', headers: {}, config,
      });
    } else if (config.url === '/api/referral/list') {
      config.adapter = async () => ({
        data: MOCK_REFERRALS,
        status: 200, statusText: 'OK', headers: {}, config,
      });
    } else if (config.url === '/api/referral/create') {
      config.adapter = async () => ({
        data: { docId: 'doc_' + Math.random().toString(36).substr(2, 9) },
        status: 200, statusText: 'OK', headers: {}, config,
      });
    }
  }

  const token = await storage.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor for Auto-Logout
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await storage.clear();
      console.log('[MediRef] Session expired or invalid. Logging out.');
    }
    return Promise.reject(error);
  }
);

export default api;
