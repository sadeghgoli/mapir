// app/contexts/AuthContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface User {
    id: string;
    name: string;
    phone: string;
    email?: string;
    avatar?: string;
}

interface AuthContextType {
    user: User | null;
    accessToken: string | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: () => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = 'https://apiweb-payonmap.sabzevar.ir:8446';

const getLocalStorage = (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(key);
};

const setLocalStorage = (key: string, value: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, value);
};

const removeLocalStorage = (key: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(key);
};

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [mounted, setMounted] = useState(false);
    const router = useRouter();

    const saveAuthData = useCallback((token: string, userData: User) => {
        setAccessToken(token);
        setUser(userData);
        setLocalStorage('token', token);
        setLocalStorage('user', JSON.stringify(userData));
    }, []);

    const clearAuthData = useCallback(() => {
        setAccessToken(null);
        setUser(null);
        removeLocalStorage('token');
        removeLocalStorage('user');
    }, []);

    const fetchUserInfo = useCallback(async (token: string): Promise<User | null> => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const result = await response.json();
                return result.data || result;
            }
            return null;
        } catch (error) {
            console.error('Error fetching user info:', error);
            return null;
        }
    }, []);

    const login = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await fetch(`${API_BASE_URL}/api/auth/login`);
            const data = await response.json();

            if (data.loginUrl) {
                const state = Math.random().toString(36).substring(2);
                sessionStorage.setItem('loginState', state);

                // ✅ prompt=login از سمت فرانت هم اضافه میشه (دو لایه اطمینان)
                const loginUrl = new URL(data.loginUrl);
                loginUrl.searchParams.set('prompt', 'login');

                window.location.href = loginUrl.toString();
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('خطا در اتصال به سرور');
            setIsLoading(false);
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            // ✅ توکن از localStorage خونده میشه نه از state
            const token = getLocalStorage('token');

            if (token) {
                await fetch(`${API_BASE_URL}/api/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // ✅ همیشه اجرا میشه حتی اگه API خطا بده
            clearAuthData();
            router.push('/');
        }
    }, [clearAuthData, router]);

    // ✅ set mounted
    useEffect(() => {
        setMounted(true);
    }, []);

    // ✅ بارگذاری اولیه از localStorage
    useEffect(() => {
        if (!mounted) return;

        const initAuth = async () => {
            setIsLoading(true);

            const storedToken = getLocalStorage('token');
            const storedUser = getLocalStorage('user');

            if (storedToken && storedUser) {
                try {
                    setAccessToken(storedToken);
                    setUser(JSON.parse(storedUser));
                } catch {
                    clearAuthData();
                }
            } else if (storedToken && !storedUser) {
                const userInfo = await fetchUserInfo(storedToken);
                if (userInfo) {
                    saveAuthData(storedToken, userInfo);
                } else {
                    clearAuthData();
                }
            }

            setIsLoading(false);
        };

        initAuth();
    }, [mounted, fetchUserInfo, saveAuthData, clearAuthData]);

    // ✅ گوش دادن به storage event — وقتی callback توکن را ذخیره کرد
    useEffect(() => {
        if (!mounted) return;

        const handleStorageChange = async (e: StorageEvent) => {
            if (e.key === 'token' && e.newValue) {
                const token = e.newValue;
                const storedUser = localStorage.getItem('user');

                if (storedUser) {
                    try {
                        setAccessToken(token);
                        setUser(JSON.parse(storedUser));
                    } catch {
                        const userData = await fetchUserInfo(token);
                        if (userData) saveAuthData(token, userData);
                    }
                } else {
                    const userData = await fetchUserInfo(token);
                    if (userData) saveAuthData(token, userData);
                }
            }

            if (e.key === 'token' && !e.newValue) {
                clearAuthData();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [mounted, fetchUserInfo, saveAuthData, clearAuthData]);

    // ✅ اعتبارسنجی دوره‌ای توکن هر 5 دقیقه
    useEffect(() => {
        if (!mounted || !accessToken) return;

        const validateToken = async () => {
            const userInfo = await fetchUserInfo(accessToken);
            if (!userInfo) {
                await logout();
            }
        };

        const interval = setInterval(validateToken, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [accessToken, fetchUserInfo, logout, mounted]);

    if (!mounted) {
        return (
            <AuthContext.Provider
                value={{
                    user: null,
                    accessToken: null,
                    isLoading: true,
                    isAuthenticated: false,
                    login: async () => {},
                    logout: async () => {},
                }}
            >
                {children}
            </AuthContext.Provider>
        );
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                accessToken,
                isLoading,
                isAuthenticated: !!accessToken && !!user,
                login,
                logout,
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