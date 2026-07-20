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
    permissions: string[];
    isLoading: boolean;
    isAuthenticated: boolean;
    hasPermission: (permission: string) => boolean;
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
    const [permissions, setPermissions] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [mounted, setMounted] = useState(false);
    const router = useRouter();

    const hasPermission = useCallback((permission: string): boolean => {
        return permissions.includes(permission);
    }, [permissions]);

    const parsePermissionsFromToken = useCallback((token: string): string[] => {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const perms: string[] = [];
            for (const key in payload) {
                if (key === 'permission') {
                    if (Array.isArray(payload[key])) {
                        perms.push(...payload[key]);
                    } else {
                        perms.push(payload[key]);
                    }
                }
            }
            return perms;
        } catch {
            return [];
        }
    }, []);

    const saveAuthData = useCallback((token: string, userData: User, perms?: string[]) => {
        setAccessToken(token);
        setUser(userData);
        const p = perms ?? parsePermissionsFromToken(token);
        setPermissions(p);
        setLocalStorage('token', token);
        setLocalStorage('user', JSON.stringify(userData));
        setLocalStorage('permissions', JSON.stringify(p));
    }, [parsePermissionsFromToken]);

    const clearAuthData = useCallback(() => {
        setAccessToken(null);
        setUser(null);
        setPermissions([]);
        removeLocalStorage('token');
        removeLocalStorage('user');
        removeLocalStorage('permissions');
    }, []);

    const fetchUserInfo = useCallback(async (token: string): Promise<{ user: User | null; permissions: string[] }> => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const result = await response.json();
                return {
                    user: result.data || result,
                    permissions: result.permissions ?? [],
                };
            }
            return { user: null, permissions: [] };
        } catch (error) {
            console.error('Error fetching user info:', error);
            return { user: null, permissions: [] };
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
            const storedPermissions = getLocalStorage('permissions');

            if (storedToken && storedUser) {
                try {
                    setAccessToken(storedToken);
                    setUser(JSON.parse(storedUser));
                    setPermissions(storedPermissions ? JSON.parse(storedPermissions) : []);
                } catch {
                    clearAuthData();
                }
            } else if (storedToken && !storedUser) {
                const { user, permissions } = await fetchUserInfo(storedToken);
                if (user) {
                    saveAuthData(storedToken, user, permissions);
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
                const storedPermissions = localStorage.getItem('permissions');

                if (storedUser) {
                    try {
                        setAccessToken(token);
                        setUser(JSON.parse(storedUser));
                        setPermissions(storedPermissions ? JSON.parse(storedPermissions) : []);
                    } catch {
                        const { user, permissions } = await fetchUserInfo(token);
                        if (user) saveAuthData(token, user, permissions);
                    }
                } else {
                    const { user, permissions } = await fetchUserInfo(token);
                    if (user) saveAuthData(token, user, permissions);
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
            const { user: userInfo, permissions: perms } = await fetchUserInfo(accessToken);
            if (!userInfo) {
                await logout();
            } else {
                setPermissions(perms);
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
                    permissions: [],
                    isLoading: true,
                    isAuthenticated: false,
                    hasPermission: () => false,
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
                permissions,
                isLoading,
                isAuthenticated: !!accessToken && !!user,
                hasPermission,
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