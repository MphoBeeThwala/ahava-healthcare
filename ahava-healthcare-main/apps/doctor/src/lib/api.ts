import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      try {
        await axios.post(`${API_URL}/api/auth/refresh`, {}, { withCredentials: true });
        return api(error.config);
      } catch {
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: async (email: string, password: string) => api.post('/api/auth/login', { email, password }),
  logout: async () => api.post('/api/auth/logout'),
  getMe: async () => api.get('/api/auth/me'),
};

export const visitsAPI = {
  list: async (params?: any) => api.get('/api/visits', { params }),
  getById: async (id: string) => api.get(`/api/visits/${id}`),
  addReview: async (id: string, data: { doctorReview: string; doctorRating?: number }) =>
    api.post(`/api/visits/${id}/doctor-review`, data),
};

export const messagesAPI = {
  getForVisit: async (visitId: string) => api.get(`/api/messages/visit/${visitId}`),
  send: async (data: any) => api.post('/api/messages', data),
};

export default api;


