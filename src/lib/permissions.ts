// Permission constants
export const PERMISSIONS = {
  // User management
  MANAGE_USERS: 'manage_users',
  REGISTER_USERS: 'register_users',
  EDIT_USERS: 'edit_users',
  DELETE_USERS: 'delete_users',
  VIEW_USERS: 'view_users',
  VIEW_ROLES: 'view_roles',

  // Email operations
  VIEW_EMAILS: 'view_emails',
  APPROVE_EMAILS: 'approve_emails',
  REJECT_EMAILS: 'reject_emails',
  RECEIVE_EMAIL: 'receive_email',
  SEND_EMAIL: 'send_email',
  SIGN_EMAIL: 'sign_email',

  // Queue operations
  VIEW_QUEUE: 'view_queue',
  MANAGE_QUEUE: 'manage_queue',
  PROCESS_QUEUE: 'process_queue',

  // Content access
  VIEW_ATTACHMENTS: 'view_attachments',

  // Monitoring and metrics
  VIEW_METRICS: 'view_metrics',
  VIEW_HEALTH: 'view_health',
  VIEW_SYSTEM_METRICS: 'view_system_metrics',
};

// Role constants
export const ROLES = {
  ADMIN: 'ADMIN',
  APPROVER: 'APPROVER',
  VIEWER: 'VIEWER',
  SENDER: 'SENDER',
};

// Role to permissions mapping
// NOTE: This mapping is now deprecated as permissions are provided directly by the API
// Keeping for backward compatibility and potential fallback scenarios
export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: [
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.REGISTER_USERS,
    PERMISSIONS.EDIT_USERS,
    PERMISSIONS.DELETE_USERS,
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.VIEW_ROLES,
    PERMISSIONS.VIEW_EMAILS,
    PERMISSIONS.APPROVE_EMAILS,
    PERMISSIONS.REJECT_EMAILS,
    PERMISSIONS.RECEIVE_EMAIL,
    PERMISSIONS.SEND_EMAIL,
    PERMISSIONS.SIGN_EMAIL,
    PERMISSIONS.VIEW_QUEUE,
    PERMISSIONS.MANAGE_QUEUE,
    PERMISSIONS.PROCESS_QUEUE,
    PERMISSIONS.VIEW_ATTACHMENTS,
    PERMISSIONS.VIEW_METRICS,
    PERMISSIONS.VIEW_HEALTH,
    PERMISSIONS.VIEW_SYSTEM_METRICS,
  ],
  [ROLES.APPROVER]: [
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.VIEW_EMAILS,
    PERMISSIONS.APPROVE_EMAILS,
    PERMISSIONS.REJECT_EMAILS,
    PERMISSIONS.VIEW_QUEUE,
    PERMISSIONS.VIEW_ATTACHMENTS,
    PERMISSIONS.VIEW_METRICS,
  ],
  [ROLES.VIEWER]: [
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.VIEW_EMAILS,
    PERMISSIONS.VIEW_QUEUE,
    PERMISSIONS.VIEW_ATTACHMENTS,
    PERMISSIONS.VIEW_METRICS,
  ],
  [ROLES.SENDER]: [
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.SEND_EMAIL,
    PERMISSIONS.VIEW_QUEUE,
    PERMISSIONS.PROCESS_QUEUE,
    PERMISSIONS.VIEW_ATTACHMENTS,
  ],
};

// Type definitions for better TypeScript support
export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
export type Role = (typeof ROLES)[keyof typeof ROLES];
