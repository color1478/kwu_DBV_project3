import api from './api';

export interface User {
  userId: number;
  email: string;
  nickname: string | null;
  role: 'USER' | 'ADMIN';
}

export const auth = {
  async login(email: string, password: string) {
    const response = await api.post('/api/auth/login', { email, password });
    return response.data;
  },

  async register(email: string, password: string, nickname?: string) {
    const response = await api.post('/api/auth/register', { email, password, nickname });
    return response.data;
  },

  async logout() {
    const response = await api.post('/api/auth/logout');
    return response.data;
  },

  async getCurrentUser() {
    try {
      const response = await api.get('/api/auth/me');
      return response.data.user;
    } catch (error) {
      return null;
    }
  },
};

