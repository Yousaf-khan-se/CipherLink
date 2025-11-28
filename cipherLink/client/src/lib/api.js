import axios from 'axios';
import { storage } from './utils';

// Determine API base URL based on environment
const getBaseUrl = () => {
    // In production, use the same origin (served from backend)
    // In development, Vite proxy handles /api routing
    return import.meta.env.VITE_API_URL || '/api';
};

// Create axios instance with default config
const api = axios.create({
    baseURL: getBaseUrl(),
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request interceptor - add auth token
api.interceptors.request.use(
    (config) => {
        const token = storage.get('userToken');
        if (token) {
            config.headers['x-auth-token'] = token;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - handle errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle 401 - unauthorized
        if (error.response?.status === 401) {
            // Clear stored auth data
            storage.remove('userToken');
            storage.remove('user');

            // Redirect to login if not already there
            if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
                window.location.href = '/login';
            }
        }

        // Extract error message
        const message = error.response?.data?.error || error.message || 'An error occurred';

        return Promise.reject(new Error(message));
    }
);

// Auth API
export const authApi = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
    checkUsername: (username) => api.get(`/auth/check-username/${username}`)
};

// User API
export const userApi = {
    getMe: () => api.get('/users/me'),
    updateProfile: (data) => api.put('/users/me', data),
    updateStatus: (data) => api.put('/users/status', data),
    getOnlineUsers: () => api.get('/users/online'),
    getAllUsers: (params) => api.get('/users/all', { params }),
    searchUsers: (query) => api.get('/users/search', { params: { q: query } }),
    getUserByHash: (hash) => api.get(`/users/by-hash/${hash}`),
    deleteAccount: () => api.delete('/users/me')
};

// Chat API
export const chatApi = {
    getMessages: (channel, params) => api.get(`/chats/${channel}`, { params }),
    getPrivateChannels: () => api.get('/chats/channels/private'),
    sendMessage: (data) => api.post('/chats', data),
    markSeen: (messageId) => api.put(`/chats/${messageId}/seen`),
    markChannelSeen: (channel) => api.put(`/chats/channel/${channel}/seen`),
    deleteMessage: (messageId) => api.delete(`/chats/${messageId}`)
};

export default api;
