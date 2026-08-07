"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
  adminLogin,
  adminMe,
  adminLogout,
  impersonateStaff as apiImpersonateStaff,
  exitImpersonation as apiExitImpersonation,
  AdminUser,
} from '../lib/admin-api';
import { firstPermittedPath } from '../lib/permissions';

interface AuthContextProps {
  admin: AdminUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AdminUser>;
  logout: () => Promise<void>;
  impersonate: (staffId: string) => Promise<void>;
  exitImpersonation: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AdminAuthProvider');
  }
  return context;
};

export const AdminAuthProvider = ({ children }: { children: ReactNode }) => {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  const refreshAuth = async () => {
    const user = await adminMe();
    setAdmin(user);
  };

  useEffect(() => {
    (async () => {
      const user = await adminMe();
      setAdmin(user);
      setLoading(false);
    })();
  }, []);

  const login = async (email: string, password: string): Promise<AdminUser> => {
    const user = await adminLogin(email, password);
    setAdmin(user);
    return user;
  };

  const logout = async () => {
    await adminLogout();
    setAdmin(null);
    router.push('/login');
  };

  /**
   * Start impersonating a staff member.
   * Updates auth state to reflect the staff account, then navigates
   * to the first permitted path for that staff's permissions.
   */
  const impersonate = async (staffId: string) => {
    const staffUser = await apiImpersonateStaff(staffId);
    setAdmin(staffUser);
    // Navigate to the first route the staff member can access
    const permissions = (staffUser.permissions || []).filter((p) => p !== 'staff');
    const destination = firstPermittedPath(permissions);
    router.push(destination);
  };

  /**
   * Exit impersonation and restore the original admin session.
   * Navigates back to /dashboard/staff.
   */
  const exitImpersonation = async () => {
    const adminUser = await apiExitImpersonation();
    setAdmin(adminUser);
    router.push('/dashboard/staff');
  };

  return (
    <AuthContext.Provider value={{ admin, loading, login, logout, impersonate, exitImpersonation, refreshAuth }}>
      {children}
    </AuthContext.Provider>
  );
};
