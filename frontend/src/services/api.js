import axios from 'axios';

const api = axios.create({
    // In dev, Vite proxies /api to the backend (see vite.config.js).
    // VITE_API_URL is only for production builds hosted apart from the backend.
    baseURL: (!import.meta.env.DEV && import.meta.env.VITE_API_URL) || '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const isAuthCall = error.config?.url?.startsWith('/auth/');
        if (error.response?.status === 401 && !isAuthCall && localStorage.getItem('token')) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.assign('/login');
        }
        return Promise.reject(error);
    }
);

export default api;
