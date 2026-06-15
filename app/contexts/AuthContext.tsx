// app/contexts/AuthContext.tsx
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export interface User {
    id: string;
    name: string;
    phone: string;
    email?: string;
    avatar?: string;
}

interface AuthContextType {
    user: User | null;
    accessToken: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: () => Promise<void>;
    logout: () => Promise<void>;
    refreshToken: () => Promise<string | null>;
    apiRequest: <T = any>(url: string, options?: RequestInit) => Promise<T>;
    updateUser: (userData: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = 'https://apiweb-payonmap.sabzevar.ir:8446';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // تابع برای دریافت اطلاعات کاربر با توکن
    const fetchCurrentUser = async (token: string): Promise<User | null> => {
        try {
            const response = await fetch(`${API_BASE}/api/Auth/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) return await response.json();
            if (response.status === 401) return null;
            return null;
        } catch (error) {
            console.error('Error fetching user:', error);
            return null;
        }
    };

    // بارگذاری اولیه کاربر از localStorage در start-up
    useEffect(() => {
        const loadUser = async () => {
            setIsLoading(true);
            const storedToken = localStorage.getItem('accessToken');
            if (storedToken) {
                setAccessToken(storedToken);
                const userData = await fetchCurrentUser(storedToken);
                if (userData) {
                    setUser(userData);
                } else {
                    localStorage.removeItem('accessToken');
                    setAccessToken(null);
                }
            }
            setIsLoading(false);
        };
        loadUser();
    }, []);

    // شروع فرآیند لاگین با دریافت آدرس SSO
    const login = async () => {
        try {
            const response = await fetch(`${API_BASE}/api/Auth/login`);
            if (!response.ok) throw new Error('خطا در دریافت آدرس لاگین');
            const { loginUrl, state } = await response.json();
            sessionStorage.setItem('loginState', state);
            window.location.href = loginUrl;
        } catch (error) {
            console.error('شروع لاگین با خطا مواجه شد:', error);
        }
    };

    // تمدید accessToken با استفاده از refreshToken که در کوکی HttpOnly ذخیره شده
    const refreshToken = async (): Promise<string | null> => {
        try {
            const response = await fetch(`${API_BASE}/api/Auth/refresh`, {
                method: 'POST',
                credentials: 'include',
            });
            if (!response.ok) return null;
            const data = await response.json();
            const newToken = data.accessToken;
            if (newToken) {
                setAccessToken(newToken);
                localStorage.setItem('accessToken', newToken);
                return newToken;
            }
            return null;
        } catch (error) {
            console.error('خطا در تمدید توکن:', error);
            return null;
        }
    };

    // تابع کمکی برای ارسال درخواست‌های احراز هویت شده
    const apiRequest = async <T = any>(
        url: string,
        options: RequestInit = {}
    ): Promise<T> => {
        let token = accessToken;

        const makeRequest = async (retry = true): Promise<T> => {
            const res = await fetch(url, {
                ...options,
                headers: {
                    ...options.headers,
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (res.status === 401 && retry && token) {
                const newToken = await refreshToken();
                if (newToken) {
                    token = newToken;
                    return makeRequest(false);
                } else {
                    await logout(false);
                    throw new Error('توکن منقضی شده و قادر به تمدید نیست');
                }
            }

            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(`درخواست با خطا مواجه شد: ${res.status} - ${errorText}`);
            }
            return res.json();
        };

        return makeRequest();
    };

    // عملیات خروج از حساب
    const logout = async (redirectToHome = true) => {
        try {
            if (accessToken) {
                await fetch(`${API_BASE}/api/Auth/logout`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${accessToken}` },
                    credentials: 'include',
                });
            }
        } catch (error) {
            console.error('خطا در خروج از حساب:', error);
        } finally {
            localStorage.removeItem('accessToken');
            setAccessToken(null);
            setUser(null);
            if (redirectToHome) router.push('/');
        }
    };

    const updateUser = (userData: User) => {
        setUser(userData);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                accessToken,
                isAuthenticated: !!user,
                isLoading,
                login,
                logout,
                refreshToken,
                apiRequest,
                updateUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};