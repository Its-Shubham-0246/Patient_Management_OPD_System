import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('smart_opd_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Standard error logging
    if (error.response?.data?.error) {
      console.error('[API Error]:', error.response.data.error.message);
    }
    return Promise.reject(error);
  }
);

export const checkHealth = async () => {
  try {
    const res = await apiClient.get('/health');
    return res.data;
  } catch (error) {
    return { success: false, error: 'Cannot connect to backend server' };
  }
};

