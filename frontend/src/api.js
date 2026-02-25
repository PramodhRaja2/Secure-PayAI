import axios from 'axios';

const API = axios.create({
    // Central Source of Truth for the Backend URL
    // Use the Vite proxy during development, or the production URL in production
    baseURL: import.meta.env.DEV ? '/api' : (import.meta.env.VITE_API_URL || 'https://secure-payai.onrender.com'),
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add a request interceptor to automatically add the Authorization header if token exists
API.interceptors.request.use(config => {
    const token = localStorage.getItem('securepay_token');
    if (token) {
        config.headers.Authorization = token;
    }
    return config;
}, error => {
    return Promise.reject(error);
});

export default API;
