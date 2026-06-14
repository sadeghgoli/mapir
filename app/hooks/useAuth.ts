// hooks/useAuth.ts

import { useState, useEffect, useCallback } from 'react';
import { authService, UserInfo } from '../services/auth.service';

interface UseAuthReturn {
  user: UserInfo | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      
      if (!authService.isAuthenticated()) {
        setUser(null);
        return;
      }
      
      const userInfo = await authService.getCurrentUser();
      setUser(userInfo);
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async () => {
    try {
      setIsLoading(true);
      const { loginUrl } = await authService.initiateLogin();
      // هدایت به صفحه لاگین SSO
      window.location.href = loginUrl;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      await authService.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // بررسی خودکار لاگین در شروع
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    checkAuth,
  };
};