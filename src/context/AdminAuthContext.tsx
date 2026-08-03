"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { adminLogin, adminMe, adminLogout, AdminUser } from '../lib/admin-api';

interface AuthContextProps {
  admin: AdminUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AdminUser>;
  logout: () => Promise<void>;
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

  return (
    <AuthContext.Provider value={{ admin, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
