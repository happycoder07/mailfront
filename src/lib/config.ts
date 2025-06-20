// API Configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://localhost/api';

// API Endpoints
export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    LOGIN: `${API_BASE_URL}/auth/login`,
    REGISTER: `${API_BASE_URL}/auth/register`,
    PROFILE: `${API_BASE_URL}/auth/profile`,
    LOGOUT: `${API_BASE_URL}/auth/logout`,
    USERS: `${API_BASE_URL}/auth/users`,
    USER: (id: string) => `${API_BASE_URL}/auth/users/${id}`,
    ROLES: `${API_BASE_URL}/auth/roles`,
    CSRF_TOKEN: `${API_BASE_URL}/auth/csrf-token`,
  },

  // Mail endpoints
  MAIL: {
    LIST: `${API_BASE_URL}/mail`,
    DETAIL: (id: string) => `${API_BASE_URL}/mail/${id}`,
    APPROVE: (id: string) => `${API_BASE_URL}/mail/${id}/approve`,
    REJECT: (id: string) => `${API_BASE_URL}/mail/${id}/reject`,
    SIGN: (id: string) => `${API_BASE_URL}/mail/${id}/sign`,
    CREATE: `${API_BASE_URL}/mail`,
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

  // Settings endpoints
  SETTINGS: {
    GET: '/api/settings',
    UPDATE: '/api/settings',
  },
};

// API Types based on OpenAPI specification
export type LoginDto = {
  email: string;
  password: string;
};

export type RegisterDto = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  roleId: number;
};

export type ChangePasswordDto = {
  currentPassword: string;
  newPassword: string;
};

export type EditUserDto = {
  email?: string;
  firstName?: string;
  lastName?: string;
  roleId?: number;
};

export type Role = {
  id: number;
  name: string;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
};

export type User = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  roleId: number;
  createdAt: string;
  updatedAt: string;
  role: Role;
};

export type UserListResponse = {
  data: User[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export type RecipientDto = {
  address: string;
  type: 'TO' | 'CC' | 'BCC';
};

export type AttachmentDto = {
  id: number;
  filename: string;
  contentType: string;
  size: number;
  minioKey: string;
  emailId: number;
  createdAt: string;
  updatedAt: string;
};

export type EmailRecipientDto = {
  id: number;
  emailId: number;
  address: string;
  type: 'TO' | 'CC' | 'BCC';
  createdAt: string;
  updatedAt: string;
};

export type CreateEmailDto = {
  from: string;
  recipients: RecipientDto[];
  subject: string;
  content: string;
  html?: string;
  attachments?: {
    filename: string;
    path: string;
    contentType: string;
  }[];
};

export type EmailStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SENT' | 'FAILED';

export type EmailResponseDto = {
  id: number;
  from: string;
  subject: string;
  content: string;
  status: EmailStatus;
  signedContent?: string;
  rejectionReason?: string;
  approvedBy?: number;
  approvedAt?: string;
  rejectedBy?: number;
  rejectedAt?: string;
  attachments: AttachmentDto[];
  recipients: EmailRecipientDto[];
  createdAt: string;
  updatedAt: string;
};

export type PaginatedEmailResponseDto = {
  items: EmailResponseDto[];
  meta: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
};

export type RejectEmailDto = {
  reason: string;
};
