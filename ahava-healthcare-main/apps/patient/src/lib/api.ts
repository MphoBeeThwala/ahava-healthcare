import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

export const authAPI = {
  register: async (data: any) => api.post('/api/auth/register', { ...data, role: 'PATIENT' }),
  login: async (email: string, password: string) => api.post('/api/auth/login', { email, password }),
  logout: async () => api.post('/api/auth/logout'),
  getMe: async () => api.get('/api/auth/me'),
};

export const bookingsAPI = {
  create: async (data: any) => api.post('/api/bookings', data),
  list: async () => api.get('/api/bookings'),
  getById: async (id: string) => api.get(`/api/bookings/${id}`),
  cancel: async (id: string) => api.patch(`/api/bookings/${id}/cancel`),
};

export const paymentsAPI = {
  initialize: async (bookingId: string) => api.post('/api/payments/initialize', { bookingId }),
  verify: async (reference: string) => api.post('/api/payments/verify', { reference }),
};

export const visitsAPI = {
  list: async () => api.get('/api/visits'),
  getById: async (id: string) => api.get(`/api/visits/${id}`),
};

export const messagesAPI = {
  getForVisit: async (visitId: string) => api.get(`/api/messages/visit/${visitId}`),
  send: async (data: any) => api.post('/api/messages', data),
  markAsRead: async (messageIds: string[]) => api.post('/api/messages/read', { messageIds }),
};

export default api;


