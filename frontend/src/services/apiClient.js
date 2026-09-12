import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000
});

apiClient.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem('lawintel_auth_token');
    const role = localStorage.getItem('lawintel_user_role');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (role) {
      config.headers['x-user-role'] = role;
    }
  } catch (e) {
    // localStorage unavailable
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const errorData = error.response?.data || {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error.message || 'Network request failed'
      }
    };
    return Promise.reject(errorData);
  }
);

export default apiClient;
