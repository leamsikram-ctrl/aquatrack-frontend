import axios from 'axios';

export const apiClient = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Attach Sanctum bearer token if present
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('aquatrack_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global interceptor for unauthenticated or session expiry
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('aquatrack_token');
      localStorage.removeItem('aquatrack_user');
    }
    return Promise.reject(error);
  }
);
