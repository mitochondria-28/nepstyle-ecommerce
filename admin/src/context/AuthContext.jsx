import { createContext, useContext, useState, useCallback } from 'react';
import { adminLogin } from '../api';

const AuthContext = createContext(null);

const STORAGE_KEY = 'nepstyle_admin_auth';

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const login = useCallback(async (email, password) => {
    const res = await adminLogin({ email_address: email, password });
    const adminData = res.data.admin;
    setAdmin(adminData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(adminData));
    return adminData;
  }, []);

  const logout = useCallback(() => {
    setAdmin(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{ admin, login, logout, isAuthenticated: !!admin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
