// app/contexts/AuthContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { PAY_API_URL } from '@/app/utils/apiConfig';

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
    roles: string[];
    isLoading: boolean;
    isAuthenticated: boolean;
    hasPermission: (permission: string) => boolean;
    hasRole: (role: string) => boolean;
    login: () => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = PAY_API_URL;

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
    const [roles, setRoles] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [mounted, setMounted] = useState(false);
    const router = useRouter();

    const hasPermission = useCallback((permission: string): boolean => {
        return permissions.includes(permission);
    }, [permissions]);

    const hasRole = useCallback((role: string): boolean => {
        return roles.includes(role);
    }, [roles]);

    const parseClaimsFromToken = useCallback((token: string) => {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const perms: string[] = [];
            const rls: string[] = [];
            for (const key in payload) {
                const val = payload[key];
                if (key === 'permission') {
                    if (Array.isArray(val)) perms.push(...val);
                    else perms.push(val);
                }
                if (key === 'role') {
                    if (Array.isArray(val)) rls.push(...val);
                    else rls.push(val);
                }
            }
            return { permissions: perms, roles: rls };
        } catch {
            return { permissions: [] as string[], roles: [] as string[] };
        }
    }, []);

    const saveAuthData = useCallback((token: string, userData: User, perms?: string[], rls?: string[]) => {
        setAccessToken(token);
        setUser(userData);
        const claims = parseClaimsFromToken(token);
        const p = perms ?? claims.permissions;
        const r = rls ?? claims.roles;
        setPermissions(p);
        setRoles(r);
        setLocalStorage('token', token);
        setLocalStorage('user', JSON.stringify(userData));
        setLocalStorage('permissions', JSON.stringify(p));
        setLocalStorage('roles', JSON.stringify(r));
    }, [parseClaimsFromToken]);

    const clearAuthData = useCallback(() => {
        setAccessToken(null);
        setUser(null);
        setPermissions([]);
        setRoles([]);
        removeLocalStorage('token');
        removeLocalStorage('user');
        removeLocalStorage('permissions');
        removeLocalStorage('roles');
    }, []);

    const fetchUserInfo = useCallback(async (token: string): Promise<{ user: User | null; permissions: string[]; roles: string[] }> => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const result = await response.json();
                const { permissions: p, roles: r } = parseClaimsFromToken(token);
                return {
                    user: result.data || result,
                    permissions: result.permissions ?? p,
                    roles: r,
                };
            }
            return { user: null, permissions: [], roles: [] };
        } catch (error) {
            console.error('Error fetching user info:', error);
            return { user: null, permissions: [], roles: [] };
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
                    const storedRoles = getLocalStorage('roles');
                    setRoles(storedRoles ? JSON.parse(storedRoles) : []);
                } catch {
                    clearAuthData();
                }
            } else if (storedToken && !storedUser) {
                const { user, permissions, roles } = await fetchUserInfo(storedToken);
                if (user) {
                    saveAuthData(storedToken, user, permissions, roles);
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
                        const storedRoles = localStorage.getItem('roles');
                        setRoles(storedRoles ? JSON.parse(storedRoles) : []);
                    } catch {
                        const { user, permissions, roles } = await fetchUserInfo(token);
                        if (user) saveAuthData(token, user, permissions, roles);
                    }
                } else {
                    const { user, permissions, roles } = await fetchUserInfo(token);
                    if (user) saveAuthData(token, user, permissions, roles);
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
            const { user: userInfo, permissions: perms, roles: rls } = await fetchUserInfo(accessToken);
            if (!userInfo) {
                await logout();
            } else {
                setPermissions(perms);
                setRoles(rls);
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
                    roles: [],
                    isLoading: true,
                    isAuthenticated: false,
                    hasPermission: () => false,
                    hasRole: () => false,
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
                roles,
                isLoading,
                isAuthenticated: !!accessToken && !!user,
                hasPermission,
                hasRole,
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