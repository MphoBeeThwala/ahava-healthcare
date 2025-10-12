import axios, { AxiosInstance, AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Important for httpOnly cookies
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage as fallback (for API clients)
    const token = localStorage.getItem('accessToken');
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest: any = error.config;

    // Handle 401 errors (token expired)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh token
        const response = await axios.post(
          `${API_URL}/api/auth/refresh`,
          {},
          { withCredentials: true }
        );

        if (response.data.accessToken) {
          localStorage.setItem('accessToken', response.data.accessToken);
        }

        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await api.post('/api/auth/login', { email, password });
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/api/auth/logout');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    return response.data;
  },

  getMe: async () => {
    const response = await api.get('/api/auth/me');
    return response.data;
  },

  refreshToken: async () => {
    const response = await api.post('/api/auth/refresh');
    return response.data;
  },
};

// Users API
export const usersAPI = {
  list: async (params?: {
    role?: string;
    isActive?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  }) => {
    const response = await api.get('/api/admin/users', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/api/admin/users/${id}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/api/admin/users', data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.put(`/api/admin/users/${id}`, data);
    return response.data;
  },

  deactivate: async (id: string) => {
    const response = await api.delete(`/api/admin/users/${id}`);
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/api/admin/stats/overview');
    return response.data;
  },
};

// Visits API
export const visitsAPI = {
  list: async (params?: {
    status?: string;
    limit?: number;
    offset?: number;
  }) => {
    const response = await api.get('/api/visits', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/api/visits/${id}`);
    return response.data;
  },

  updateStatus: async (id: string, status: string) => {
    const response = await api.patch(`/api/visits/${id}/status`, { status });
    return response.data;
  },

  cancel: async (id: string) => {
    const response = await api.post(`/api/visits/${id}/cancel`);
    return response.data;
  },

  assignNurse: async (id: string, nurseId: string) => {
    const response = await api.post(`/api/visits/${id}/assign-nurse`, { nurseId });
    return response.data;
  },

  assignDoctor: async (id: string, doctorId: string) => {
    const response = await api.post(`/api/visits/${id}/assign-doctor`, { doctorId });
    return response.data;
  },
};

// Payments API
export const paymentsAPI = {
  list: async (params?: {
    status?: string;
    visitId?: string;
    limit?: number;
    offset?: number;
  }) => {
    const response = await api.get('/api/payments', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/api/payments/${id}`);
    return response.data;
  },

  refund: async (paymentId: string, reason?: string, partialAmount?: number) => {
    const response = await api.post('/api/payments/refund', {
      paymentId,
      reason,
      partialAmount,
    });
    return response.data;
  },
};

// Bookings API
export const bookingsAPI = {
  list: async (params?: {
    status?: string;
    limit?: number;
    offset?: number;
  }) => {
    const response = await api.get('/api/bookings', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/api/bookings/${id}`);
    return response.data;
  },
};

// Messages API
export const messagesAPI = {
  getForVisit: async (visitId: string, params?: {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
  }) => {
    const response = await api.get(`/api/messages/visit/${visitId}`, { params });
    return response.data;
  },

  send: async (data: {
    visitId: string;
    recipientId: string;
    content: string;
    type?: string;
  }) => {
    const response = await api.post('/api/messages', data);
    return response.data;
  },

  markAsRead: async (messageIds: string[]) => {
    const response = await api.post('/api/messages/read', { messageIds });
    return response.data;
  },
};

export default api;


