import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5555/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercept requests to automatically inject the JWT token if the user is logged in
api.interceptors.request.use(
  (config) => {
    const userinfo = localStorage.getItem('userInfo');
    if (userinfo) {
      const { token } = JSON.parse(userinfo);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
