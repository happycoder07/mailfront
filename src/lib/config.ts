// API Configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://localhost/api';

// API Endpoints
export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    LOGIN: `${API_BASE_URL}/auth/login`,
    LOGIN_2FA: `${API_BASE_URL}/auth/login/2fa`,
    REGISTER: `${API_BASE_URL}/auth/register`,
    PROFILE: `${API_BASE_URL}/auth/profile`,
    LOGOUT: `${API_BASE_URL}/auth/logout`,
    USERS: `${API_BASE_URL}/auth/users`,
    USER: (id: string) => `${API_BASE_URL}/auth/users/${id}`,
    ROLES: `${API_BASE_URL}/auth/roles`,
    // 2FA endpoints
    TWO_FACTOR: {
      SETUP: `${API_BASE_URL}/auth/2fa/setup`,
      ENABLE: `${API_BASE_URL}/auth/2fa/enable`,
      DISABLE: `${API_BASE_URL}/auth/2fa/disable`,
      VERIFY: `${API_BASE_URL}/auth/2fa/verify`,
      REGENERATE_BACKUP_CODES: `${API_BASE_URL}/auth/2fa/backup-codes/regenerate`,
      STATUS: `${API_BASE_URL}/auth/2fa/status`,
    },
  },

  // Mail endpoints
  MAIL: {
    LIST: `${API_BASE_URL}/mail`,
    DETAIL: (id: string) => `${API_BASE_URL}/mail/${id}`,
    APPROVE: (id: string) => `${API_BASE_URL}/mail/${id}/approve`,
    REJECT: (id: string) => `${API_BASE_URL}/mail/${id}/reject`,
    SIGN: (id: string) => `${API_BASE_URL}/mail/${id}/sign`,
    CREATE: `${API_BASE_URL}/mail`,
    ATTACHMENTS: `${API_BASE_URL}/mail/attachments`,
    UPLOAD_PROGRESS: (sessionId: string) => `${API_BASE_URL}/mail/upload-progress/${sessionId}`,
    UPLOAD_PROGRESS_STREAM: (sessionId: string) =>
      `${API_BASE_URL}/mail/upload-progress/${sessionId}/stream`,
    CONTACTS: `${API_BASE_URL}/mail/contacts`,
    CONTACT_LISTS: `${API_BASE_URL}/mail/contact-lists`,
    TEMPLATES: `${API_BASE_URL}/mail/templates`,
    TEMPLATE: (id: number) => `${API_BASE_URL}/mail/templates/${id}`,
  },

  // Queue endpoints
  QUEUE: {
    SIZE: `${API_BASE_URL}/queue/size`,
    ITEMS: `${API_BASE_URL}/queue/items`,
    PROCESS: (id: string) => `${API_BASE_URL}/queue/process/${id}`,
  },

  // Monitoring endpoints
  MONITORING: {
    HEALTH: `${API_BASE_URL}/health`,
    TERMINUS_HEALTH: `${API_BASE_URL}/health/terminus`,
    SYSTEM_STATUS: `${API_BASE_URL}/health/system-status`,
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

  // Contacts endpoints
  CONTACTS: {
    LIST: `${API_BASE_URL}/contacts`,
    DETAIL: (id: string | number) => `${API_BASE_URL}/contacts/${id}`,
    CREATE: `${API_BASE_URL}/contacts`,
    UPDATE: (id: string | number) => `${API_BASE_URL}/contacts/${id}`,
    DELETE: (id: string | number) => `${API_BASE_URL}/contacts/${id}`,
  },

  // Contact Lists endpoints
  CONTACT_LISTS: {
    LIST: `${API_BASE_URL}/contacts/lists`,
    DETAIL: (id: string | number) => `${API_BASE_URL}/contacts/lists/${id}`,
    CREATE: `${API_BASE_URL}/contacts/lists`,
    UPDATE: (id: string | number) => `${API_BASE_URL}/contacts/lists/${id}`,
    DELETE: (id: string | number) => `${API_BASE_URL}/contacts/lists/${id}`,
  },
};

// API Types based on OpenAPI specification
export type LoginDto = {
  email: string;
  password: string;
};

export type UserResponseDto = {
  id: number;
  email: string;
  role: string;
  permissions: string[];
  firstName: string;
  lastName: string;
};

export type LoginResponseDto = {
  user: UserResponseDto;
  csrf_token: string;
  message: string;
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

export type EmailStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SENT' | 'FAILED';

export type UserNameDto = {
  firstName: string;
  lastName: string;
};

export type EmailResponseDto = {
  id: number;
  from: string;
  subject: string;
  content: string;
  status: EmailStatus;
  signedContent?: string;
  rejectionReason?: string;
  approvedBy?: UserNameDto;
  approvedAt?: string;
  rejectedBy?: UserNameDto;
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

// Health check types based on OpenAPI specification
export type HealthStatus = 'ok' | 'degraded' | 'error';

export type ServiceHealth = 'healthy' | 'unhealthy' | 'unknown';

export type HealthResponseDto = {
  status: HealthStatus;
  timestamp: string;
  uptime: number;
  environment: string;
  version: string;
  services: {
    database: ServiceHealth;
    redis: ServiceHealth;
    minio: ServiceHealth;
  };
};

export type TerminusHealthStatus = 'up' | 'down';

export type TerminusHealthResponseDto = {
  status: 'ok' | 'error';
  info: {
    database?: {
      status: TerminusHealthStatus;
    };
    queue?: {
      status: TerminusHealthStatus;
      queueSize?: number;
      backlogAge?: number;
    };
    system?: {
      status: TerminusHealthStatus;
      memory?: {
        heapUsed: number;
        heapTotal: number;
        rss: number;
        external: number;
      };
      cpu?: {
        usage: number;
        cores: number;
      };
    };
  };
  error: Record<string, any>;
  details: {
    database?: {
      status: TerminusHealthStatus;
    };
    queue?: {
      status: TerminusHealthStatus;
      queueSize?: number;
      backlogAge?: number;
    };
    system?: {
      status: TerminusHealthStatus;
      memory?: {
        heapUsed: number;
        heapTotal: number;
        rss: number;
        external: number;
      };
      cpu?: {
        usage: number;
        cores: number;
      };
    };
  };
};

// System status types based on OpenAPI specification
export type MemoryUsageDto = {
  used: number;
  total: number;
  external: number;
  rss: number;
};

export type CpuUsageDto = {
  user: number;
  system: number;
};

export type SystemStatusResponseDto = {
  timestamp: string;
  uptime: number;
  memory: MemoryUsageDto;
  cpu: CpuUsageDto;
  environment: string;
  version: string;
};

// Contact and Contact List Types based on OpenAPI specification
export type CreateContactDto = {
  name: string;
  eid: string;
  contactListIds?: (string | number)[];
};

export type UpdateContactDto = {
  name?: string;
  eid?: string;
  contactListIds?: (string | number)[];
};

export type ContactListDto = {
  id: number;
  name: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ContactResponseDto = {
  id: number;
  name: string;
  eid: string;
  createdAt: string;
  updatedAt: string;
  contactLists: ContactListDto[];
};

export type PaginatedContactResponseDto = {
  items: ContactResponseDto[];
  meta: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
};

export type CreateContactListDto = {
  name: string;
  description?: string;
  contactIds?: (string | number)[];
};

export type UpdateContactListDto = {
  name?: string;
  description?: string;
  contactIds?: (string | number)[];
};

export type ContactDto = {
  id: number;
  name: string;
  eid: string;
  createdAt: string;
  updatedAt: string;
};

export type ContactListResponseDto = {
  id: number;
  name: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  contacts: ContactDto[];
};

export type PaginatedContactListResponseDto = {
  items: ContactListResponseDto[];
  meta: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
};

// Template types
export type TemplateEmailRecipientDto = {
  address: string;
  type: 'TO' | 'CC' | 'BCC';
};

export type TemplateContactRecipientDto = {
  contactId: number;
  type: 'TO' | 'CC' | 'BCC';
};

export type TemplateContactListRecipientDto = {
  contactListId: number;
  type: 'TO' | 'CC' | 'BCC';
};

export type CreateTemplateDto = {
  name: string;
  subject: string;
  content: string;
  html?: boolean;
  templateEmailRecipients?: TemplateEmailRecipientDto[];
  templateContactRecipients?: TemplateContactRecipientDto[];
  templateContactListRecipients?: TemplateContactListRecipientDto[];
};

export type EmailTemplateResponseDto = {
  id: number;
  name: string;
  subject: string;
  content: string;
  html?: boolean;
  templateEmailRecipients: TemplateEmailRecipientDto[];
  templateContactRecipients: TemplateContactRecipientDto[];
  templateContactListRecipients: TemplateContactListRecipientDto[];
  createdAt: string;
  updatedAt: string;
};

// 2FA Types
export type TwoFactorRequiredResponseDto = {
  requiresTwoFactor: boolean;
  message: string;
  tempToken: string;
  user: UserResponseDto;
};

export type VerifyTwoFactorLoginDto = {
  token: string;
  tempToken: string;
};

export type TwoFactorSetupResponseDto = {
  secret: string;
  qrCode: string;
  backupCodes: string[];
  otpauthUrl: string;
};

export type EnableTwoFactorDto = {
  token: string;
};

export type DisableTwoFactorDto = {
  token: string;
};

export type VerifyTwoFactorDto = {
  token: string;
};

export type RegenerateBackupCodesDto = {
  token: string;
};

export type TwoFactorVerificationResponseDto = {
  valid: boolean;
  message: string;
};

export type TwoFactorStatusResponseDto = {
  enabled: boolean;
  backupCodesRemaining: number;
};

// User management types
export type UserProfileDto = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  twoFactorEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  permissions: string[];
};

export type PaginatedUsersResponseDto = {
  data: UserProfileDto[];
  totalItems: number;
  totalPages: number;
  page: number;
  pageSize: number;
};
