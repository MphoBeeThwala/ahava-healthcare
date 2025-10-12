import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

export const authAPI = {
  login: async (email: string, password: string) => api.post('/api/auth/login', { email, password }),
  logout: async () => api.post('/api/auth/logout'),
  getMe: async () => api.get('/api/auth/me'),
};

export const visitsAPI = {
  list: async () => api.get('/api/visits'),
  getById: async (id: string) => api.get(`/api/visits/${id}`),
  updateStatus: async (id: string, status: string) => api.patch(`/api/visits/${id}/status`, { status }),
  updateLocation: async (id: string, lat: number, lng: number) => api.post(`/api/visits/${id}/location`, { lat, lng }),
  addReport: async (id: string, nurseReport: string) => api.post(`/api/visits/${id}/nurse-report`, { nurseReport }),
};

export const messagesAPI = {
  getForVisit: async (visitId: string) => api.get(`/api/messages/visit/${visitId}`),
  send: async (data: any) => api.post('/api/messages', data),
};

export default api;


