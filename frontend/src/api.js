import axios from 'axios';

// Production API URL: https://tresure-hunt.onrender.com/api
const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'https://tresure-hunt.onrender.com/api',
});

// Add token to requests if available
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('treasure_token');
    if (token) {
        config.headers['x-auth-token'] = token;
    }
    return config;
});

export default api;
