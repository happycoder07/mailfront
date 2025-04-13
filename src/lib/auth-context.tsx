'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Role, ROLE_PERMISSIONS, Permission, ROLES } from './permissions';
import { API_ENDPOINTS } from './config';

interface AuthContextType {
  role: Role | null;
  permissions: Permission[];
  setRole: (role: Role) => void;
  hasPermission: (permission: Permission) => boolean;
  updateAuthState: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);

  const updateAuthState = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.AUTH.PROFILE, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.role) {
          const roleKey = data.role as Role;
          if (Object.values(ROLES).includes(roleKey)) {
            setRole(roleKey);
            setPermissions(ROLE_PERMISSIONS[roleKey] || []);
          }
        }
      }
    } catch (error) {
      console.error('[Auth] Error updating auth state:', error);
    }
  };

  // Initial check on mount
  useEffect(() => {
    updateAuthState();
  }, []);

  const hasPermission = (permission: Permission): boolean => {
    if (!permission) return true;
    if (role === ROLES.ADMIN) return true;
    return permissions.includes(permission);
  };

  return (
    <AuthContext.Provider value={{ role, permissions, setRole, hasPermission, updateAuthState }}>
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
