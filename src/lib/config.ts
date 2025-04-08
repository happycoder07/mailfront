// API Configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

// API Endpoints
export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    LOGIN: `${API_BASE_URL}/auth/login`,
    REGISTER: `${API_BASE_URL}/auth/register`,
    PROFILE: `${API_BASE_URL}/auth/profile`,
    LOGOUT: `${API_BASE_URL}/auth/logout`,
  },

  // Email endpoints
  EMAIL: {
    LIST: `${API_BASE_URL}/mail`,
    DETAIL: (id: string) => `${API_BASE_URL}/mail/${id}`,
    APPROVE: (id: string) => `${API_BASE_URL}/mail/${id}/approve`,
    REJECT: (id: string) => `${API_BASE_URL}/mail/${id}/reject`,
    SIGN: (id: string) => `${API_BASE_URL}/mail/${id}/sign`,
  },

  // Queue endpoints
  QUEUE: {
    SIZE: `${API_BASE_URL}/queue/size`,
    ITEMS: `${API_BASE_URL}/queue/items`,
    PROCESS: (id: string) => `${API_BASE_URL}/queue/process/${id}`,
  },

  // Monitoring endpoints
  MONITORING: {
    HEALTH: `${API_BASE_URL}/monitoring/health`,
    METRICS: `${API_BASE_URL}/metrics`,
  },

  // File endpoints
  FILE: {
    GET: (key: string) => `${API_BASE_URL}/files/${key}`,
  },
};
