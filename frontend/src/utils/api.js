import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:3000/api/v1',
});

// 1. Attach Token to Request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 2. Handle 401 Errors (Token Expired)
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status ===403)) {
      console.warn("⚠️ Token expired or invalid. Auto-logging out...");
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
     if (window.location.pathname !== '/') {
          window.location.href = '/'; 
      }
    }
    return Promise.reject(error);
  }
);

// --- NEW HELPER FUNCTIONS ---

export const login = async (email, password) => {
  return API.post('/auth/login', { email, password });
};

export const register = async (name, email, password) => {
  return API.post('/auth/register', { name, email, password });
};

export const formatTime = (date) => {
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default API;