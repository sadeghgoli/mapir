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

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const searchParams = useSearchParams();

    // ذخیره اطلاعات
    const saveAuthData = useCallback((token: string, userData: User) => {
        console.log('💾 Saving auth data:', userData);
        setAccessToken(token);
        setUser(userData);
        localStorage.setItem('accessToken', token);
        localStorage.setItem('user', JSON.stringify(userData));
    }, []);

    // پاک کردن اطلاعات
    const clearAuthData = useCallback(() => {
        setAccessToken(null);
        setUser(null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
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

    // تابع لاگین
    const login = useCallback(async () => {
        try {
            setIsLoading(true);
            console.log('🔐 Starting login process...');

            const response = await fetch(`${API_BASE_URL}/api/auth/login`);
            const data = await response.json();

            if (data.loginUrl) {
                // باز کردن پنجره پاپ‌آپ
                const popup = window.open(data.loginUrl, '_blank', 'width=800,height=600');
                if (!popup) {
                    alert('لطفا پاپ‌آپ را در مرورگر خود فعال کنید');
                }
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('خطا در اتصال به سرور');
        } finally {
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
        const storedToken = localStorage.getItem('accessToken');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
            // اطلاعات کامل وجود دارد
            try {
                setAccessToken(storedToken);
                setUser(JSON.parse(storedUser));
                console.log('✅ Loaded stored user');
                return true;
            } catch (e) {
                console.error('Error loading user:', e);
                localStorage.removeItem('user');
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

    // گوش دادن به پیام‌های پنجره پاپ‌آپ
    useEffect(() => {
        const handleMessage = async (event: MessageEvent) => {
            // بررسی امنیت - اوریجین سرور خود را بررسی کنید
            // if (event.origin !== API_BASE_URL) return;

            const { type, token, user: userData } = event.data;

            if (type === 'LOGIN_SUCCESS' && token) {
                console.log('📨 Received login success message');

                if (userData) {
                    // اطلاعات کاربر مستقیم از پاپ‌آپ آمده
                    saveAuthData(token, userData);
                } else {
                    // فقط توکن آمده، باید اطلاعات کاربر را بگیریم
                    const userInfo = await fetchUserInfo(token);
                    if (userInfo) {
                        saveAuthData(token, userInfo);
                    } else {
                        console.error('Failed to fetch user info after login');
                        return;
                    }
                }

                // پاک کردن پارامترهای URL
                const newUrl = window.location.pathname;
                window.history.replaceState({}, '', newUrl);

                // رفرش صفحه یا هدایت به داشبورد
                router.refresh();
                router.push('/dashboard');
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [fetchUserInfo, saveAuthData, router]);

    // بررسی اولیه و مدیریت پارامترهای URL
    useEffect(() => {
        const initAuth = async () => {
            setIsLoading(true);

            // چک کردن پارامتر login=success در URL
            const loginParam = searchParams.get('login');
            const tokenFromUrl = searchParams.get('token');

            if (loginParam === 'success' || tokenFromUrl) {
                console.log('🔍 Login success detected in URL');

                // پاک کردن پارامتر از URL بدون رفرش
                const newUrl = window.location.pathname;
                window.history.replaceState({}, '', newUrl);

                if (tokenFromUrl) {
                    // توکن در URL است
                    const userInfo = await fetchUserInfo(tokenFromUrl);
                    if (userInfo) {
                        saveAuthData(tokenFromUrl, userInfo);
                        router.push('/dashboard');
                    }
                } else {
                    // بررسی localStorage
                    const success = await handleLoginSuccess();
                    if (success) {
                        router.push('/dashboard');
                    }
                }
            } else {
                // بارگذاری عادی اطلاعات ذخیره شده
                const storedToken = localStorage.getItem('accessToken');
                const storedUser = localStorage.getItem('user');

                if (storedToken && storedUser) {
                    try {
                        setAccessToken(storedToken);
                        setUser(JSON.parse(storedUser));
                        console.log('✅ Loaded stored user');
                    } catch (e) {
                        console.error('Error loading user:', e);
                        clearAuthData();
                    }
                }
            }

            setIsLoading(false);
        };

        initAuth();
    }, [searchParams, fetchUserInfo, saveAuthData, clearAuthData, handleLoginSuccess, router]);

    // بررسی اعتبار توکن در بازه‌های زمانی (اختیاری)
    useEffect(() => {
        if (!accessToken) return;

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
    }, [accessToken, fetchUserInfo, logout]);

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