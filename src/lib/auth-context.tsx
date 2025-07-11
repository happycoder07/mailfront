'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { Role, Permission, ROLES } from './permissions';
import { API_ENDPOINTS } from './config';

interface AuthContextType {
  role: Role | null;
  permissions: Permission[];
  setRole: (role: Role) => void;
  hasPermission: (permission: Permission) => boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{
    success: boolean;
    user?: any;
    message?: string;
    requires2FA?: boolean;
    tempToken?: string;
  }>;
  loginWithTwoFactor: (
    token: string,
    tempToken: string
  ) => Promise<{ success: boolean; user?: any; message?: string }>;
  logout: () => Promise<void>;
  getCSRFToken: () => string;
  mounted: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [csrfToken, setCsrfToken] = useState<string>('');
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by waiting for client mount
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const getCSRFToken = useCallback((): string => {
    return csrfToken;
  }, [csrfToken]);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(API_ENDPOINTS.AUTH.LOGIN, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.status === 400) {
        const errorData = await response.json();
        if (errorData.requiresTwoFactor) {
          return {
            success: false,
            requires2FA: true,
            tempToken: errorData.tempToken,
            message: errorData.message || 'Two-factor authentication required',
          };
        }
      }

      if (!response.ok) {
        throw new Error('Invalid credentials');
      }

      const data = await response.json();

      // Store CSRF token
      if (data.csrf_token) {
        setCsrfToken(data.csrf_token);
      }

      // Set role and permissions from login response
      if (data.user.role) {
        const roleKey = data.user.role as Role;
        setRole(roleKey);

        const userPermissions = data.user.permissions;
        setPermissions(userPermissions);
      }

      return {
        success: true,
        user: data.user,
        message: data.message,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Login failed',
      };
    }
  };

  const loginWithTwoFactor = async (token: string, tempToken: string) => {
    try {
      const response = await fetch(API_ENDPOINTS.AUTH.LOGIN_2FA, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, tempToken }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Invalid two-factor authentication token');
      }

      const data = await response.json();

      // Store CSRF token
      if (data.csrf_token) {
        setCsrfToken(data.csrf_token);
      }

      // Set role and permissions from login response
      if (data.user.role) {
        const roleKey = data.user.role as Role;
        setRole(roleKey);

        const userPermissions = data.user.permissions;
        setPermissions(userPermissions);
      }

      return {
        success: true,
        user: data.user,
        message: data.message,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Two-factor authentication failed',
      };
    }
  };

  const logout = async () => {
    try {
      if (csrfToken) {
        const response = await fetch(API_ENDPOINTS.AUTH.LOGOUT, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'X-XSRF-TOKEN': csrfToken,
          },
        });

        if (!response.ok) {
          console.warn('Logout API call failed, but continuing with local cleanup');
        }
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Continue with local cleanup even if API call fails
    } finally {
      // Always clear local state
      setRole(null);
      setPermissions([]);
      setCsrfToken('');
    }
  };

  const hasPermission = (permission: Permission): boolean => {
    // Return false during SSR to prevent hydration mismatch
    if (!mounted) {
      return false;
    }

    if (!permission || role === ROLES.ADMIN) {
      return true;
    }
    return permissions.includes(permission);
  };

  return (
    <AuthContext.Provider
      value={{
        role,
        permissions,
        setRole,
        hasPermission,
        login,
        loginWithTwoFactor,
        logout,
        getCSRFToken,
        mounted,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
