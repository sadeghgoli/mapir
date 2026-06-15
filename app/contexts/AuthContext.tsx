// app/contexts/AuthContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

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

// تابع کمکی برای دسترسی امن به localStorage
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
    const searchParams = useSearchParams();

    // ذخیره اطلاعات
    const saveAuthData = useCallback((token: string, userData: User) => {
        console.log('💾 Saving auth data:', userData);
        setAccessToken(token);
        setUser(userData);
        setLocalStorage('token', token);
        setLocalStorage('user', JSON.stringify(userData));
    }, []);

    // پاک کردن اطلاعات
    const clearAuthData = useCallback(() => {
        setAccessToken(null);
        setUser(null);
        removeLocalStorage('token');
        removeLocalStorage('user');
    }, []);

    // دریافت اطلاعات کاربر با توکن
    const fetchUserInfo = useCallback(async (token: string): Promise<User | null> => {
        try {
            console.log('📡 Fetching user info...');
            const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const userData = await response.json();
                console.log('✅ User info received:', userData);
                return userData;
            } else {
                console.error('Failed to fetch user info:', response.status);
                return null;
            }
        } catch (error) {
            console.error('Error fetching user info:', error);
            return null;
        }
    }, []);

    // تابع لاگین - تغییر یافته به هدایت در صفحه فعلی
    const login = useCallback(async () => {
        try {
            setIsLoading(true);
            console.log('🔐 Starting login process...');

            const response = await fetch(`${API_BASE_URL}/api/auth/login`);
            const data = await response.json();
            console.log(data);

            if (data.loginUrl) {
                // ایجاد state برای جلوگیری از CSRF
                const state = Math.random().toString(36).substring(2);
                sessionStorage.setItem('loginState', state);

                // اضافه کردن state به URL اگر سرور پشتیبانی می‌کند
                const loginUrl = new URL(data.loginUrl);
                loginUrl.searchParams.append('state', state);
                loginUrl.searchParams.append('redirect_uri', `${window.location.origin}/auth/callback`);

                // هدایت در همان صفحه (بدون پاپ‌آپ)
                window.location.href = loginUrl.toString();
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('خطا در اتصال به سرور');
            setIsLoading(false);
        }
    }, []);

    // تابع خروج
    const logout = useCallback(async () => {
        try {
            if (accessToken) {
                await fetch(`${API_BASE_URL}/api/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                    },
                });
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            clearAuthData();
            router.push('/');
        }
    }, [accessToken, clearAuthData, router]);

    // بررسی و تکمیل اطلاعات کاربر بعد از لاگین
    const handleLoginSuccess = useCallback(async () => {
        const storedToken = getLocalStorage('token');
        const storedUser = getLocalStorage('user');

        if (storedToken && storedUser) {
            // اطلاعات کامل وجود دارد
            try {
                setAccessToken(storedToken);
                setUser(JSON.parse(storedUser));
                console.log('✅ Loaded stored user');
                return true;
            } catch (e) {
                console.error('Error loading user:', e);
                removeLocalStorage('user');
            }
        }

        if (storedToken && !storedUser) {
            // فقط توکن وجود دارد، باید اطلاعات کاربر را دریافت کنیم
            console.log('🔄 Token exists but no user data, fetching...');
            const userData = await fetchUserInfo(storedToken);
            if (userData) {
                saveAuthData(storedToken, userData);
                return true;
            } else {
                // توکن نامعتبر است
                clearAuthData();
                return false;
            }
        }

        return false;
    }, [fetchUserInfo, saveAuthData, clearAuthData]);

    // حذف تابع handleMessage چون دیگر نیازی به ارتباط با پاپ‌آپ نیست
    // دیگر نیازی به event listener برای message نداریم

    // بررسی اولیه و مدیریت پارامترهای URL
    useEffect(() => {
        if (!mounted) return;

        const initAuth = async () => {
            setIsLoading(true);

            // بررسی توکن در localStorage
            const storedToken = getLocalStorage('token');
            const storedUser = getLocalStorage('user');

            if (storedToken && storedUser) {
                try {
                    setAccessToken(storedToken);
                    setUser(JSON.parse(storedUser));
                    console.log('✅ Loaded stored user');
                } catch (e) {
                    console.error('Error loading user:', e);
                    clearAuthData();
                }
            } else if (storedToken && !storedUser) {
                // فقط توکن وجود دارد، دریافت اطلاعات کاربر
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
    }, [fetchUserInfo, saveAuthData, clearAuthData, mounted]);

    // بررسی اعتبار توکن در بازه‌های زمانی (اختیاری)
    useEffect(() => {
        if (!mounted || !accessToken) return;

        const validateToken = async () => {
            const userInfo = await fetchUserInfo(accessToken);
            if (!userInfo) {
                console.log('⚠️ Token invalid, logging out...');
                await logout();
            }
        };

        // هر 5 دقیقه یکبار بررسی شود
        const interval = setInterval(validateToken, 5 * 60 * 1000);

        return () => clearInterval(interval);
    }, [accessToken, fetchUserInfo, logout, mounted]);

    // ست کردن mounted بعد از رندر اولیه
    useEffect(() => {
        setMounted(true);
    }, []);

    // در حین SSR یا قبل از mount، یک حالت پیش‌فرض برگردان
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