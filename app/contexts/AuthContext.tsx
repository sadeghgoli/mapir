// app/contexts/AuthContext.tsx
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
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
    isAuthenticated: boolean;
    isLoading: boolean;
    login: () => Promise<void>;
    logout: () => Promise<void>;
    refreshToken: () => Promise<string | null>;
    apiRequest: <T = any>(url: string, options?: RequestInit) => Promise<T>;
    updateUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = 'https://apiweb-payonmap.sabzevar.ir:8446/api/Auth';

// کلید برای ذخیره در sessionStorage
const POPUP_STATE_KEY = 'loginPopupState';
const POLLING_INTERVAL = 500; // میلی‌ثانیه

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [popup, setPopup] = useState<Window | null>(null);

    // به‌روزرسانی اطلاعات کاربر
    const updateUser = (userData: User | null) => {
        setUser(userData);
    };

    // دریافت اطلاعات کاربر فعلی با توکن
    const fetchCurrentUser = async (token: string): Promise<User | null> => {
        try {
            const res = await fetch(`${API_BASE}/me`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) return await res.json();
            if (res.status === 401) return null;
            return null;
        } catch {
            return null;
        }
    };

    // پردازش موفقیت‌آمیز لاگین
    const handleLoginSuccess = async (newToken: string, userData?: User) => {
        setAccessToken(newToken);
        localStorage.setItem('accessToken', newToken);

        if (userData) {
            setUser(userData);
        } else {
            // اگر userData ارسال نشده، آن را fetch کنید
            const fetchedUser = await fetchCurrentUser(newToken);
            if (fetchedUser) {
                setUser(fetchedUser);
            }
        }

        setPopup(null);
        sessionStorage.removeItem(POPUP_STATE_KEY);

        // رفرش صفحه برای به‌روزرسانی UI
        router.refresh();
    };

    // شروع فرآیند لاگین و دریافت URL
    const initiateLogin = async () => {
        const res = await fetch(`${API_BASE}/login`);
        if (!res.ok) throw new Error('خطا در شروع فرآیند ورود');
        const { loginUrl, state } = await res.json();
        sessionStorage.setItem('loginState', state);
        sessionStorage.setItem(POPUP_STATE_KEY, state);
        return loginUrl;
    };

    // متد لاگین با Popup
    const login = async () => {
        try {
            // بررسی اگر popup از قبل باز است
            if (popup && !popup.closed) {
                popup.focus();
                return;
            }

            const loginUrl = await initiateLogin();

            // محاسبه موقعیت popup در مرکز صفحه
            const width = 600;
            const height = 700;
            const left = window.screenX + (window.innerWidth - width) / 2;
            const top = window.screenY + (window.innerHeight - height) / 2;

            // باز کردن popup
            const popupWindow = window.open(
                loginUrl,
                'oauth2-login',
                `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,toolbar=no,menubar=no,location=yes,status=yes`
            );

            if (!popupWindow) {
                // اگر popup مسدود شده باشد، fallback به ریدایرکت معمولی
                window.location.href = loginUrl;
                return;
            }

            setPopup(popupWindow);

            // شروع بررسی وضعیت popup
            const checkPopupClosed = setInterval(() => {
                if (popupWindow.closed) {
                    clearInterval(checkPopupClosed);
                    setPopup(null);
                    sessionStorage.removeItem(POPUP_STATE_KEY);
                }
            }, 500);

        } catch (error) {
            console.error('Login initiation failed:', error);
        }
    };

    // رفرش توکن
    const refreshToken = async (): Promise<string | null> => {
        try {
            const res = await fetch(`${API_BASE}/refresh`, {
                method: 'POST',
                credentials: 'include',
            });
            if (!res.ok) return null;
            const data = await res.json();
            setAccessToken(data.accessToken);
            localStorage.setItem('accessToken', data.accessToken);
            return data.accessToken;
        } catch {
            return null;
        }
    };

    // درخواست API با مدیریت خودکار توکن
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
                    Authorization: `Bearer ${token}`,
                },
            });

            if (res.status === 401 && retry && token) {
                const newToken = await refreshToken();
                if (newToken) {
                    token = newToken;
                    return makeRequest(false);
                }
            }

            if (!res.ok) {
                throw new Error(`Request failed with status ${res.status}`);
            }
            return res.json();
        };

        return makeRequest();
    };

    // خروج از حساب کاربری
    const logout = async () => {
        try {
            if (accessToken) {
                await fetch(`${API_BASE}/logout`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${accessToken}` },
                    credentials: 'include',
                });
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('accessToken');
            setAccessToken(null);
            setUser(null);
            router.push('/');
        }
    };

    // گوش دادن به پیام‌های دریافتی از popup
    useEffect(() => {
        const handleMessage = async (event: MessageEvent) => {
            // بررسی منبع برای امنیت
            if (event.origin !== window.location.origin) return;

            if (event.data.type === 'LOGIN_SUCCESS') {
                const { accessToken: newToken, user: userData } = event.data;
                if (newToken) {
                    await handleLoginSuccess(newToken, userData);
                }
            }

            if (event.data.type === 'LOGIN_ERROR') {
                console.error('Login error from popup:', event.data.error);
                setPopup(null);
                sessionStorage.removeItem(POPUP_STATE_KEY);
            }
        };

        window.addEventListener('message', handleMessage);

        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, []);

    // بارگذاری اطلاعات کاربر در شروع برنامه
    useEffect(() => {
        const loadUser = async () => {
            const storedToken = localStorage.getItem('accessToken');
            if (storedToken) {
                setAccessToken(storedToken);
                const userData = await fetchCurrentUser(storedToken);
                if (userData) {
                    setUser(userData);
                } else {
                    // توکن نامعتبر
                    localStorage.removeItem('accessToken');
                    setAccessToken(null);
                }
            }
            setIsLoading(false);
        };
        loadUser();
    }, []);

    // بررسی باز بودن popup در فواصل زمانی
    useEffect(() => {
        if (!popup) return;

        const checkPopupClosed = setInterval(() => {
            if (popup.closed) {
                setPopup(null);
                sessionStorage.removeItem(POPUP_STATE_KEY);
            }
        }, 500);

        return () => clearInterval(checkPopupClosed);
    }, [popup]);

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