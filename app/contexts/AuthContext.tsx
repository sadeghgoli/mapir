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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = 'http://localhost:5046/api/Auth';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // بارگذاری اطلاعات کاربر در شروع
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

    const initiateLogin = async () => {
        const res = await fetch(`${API_BASE}/login`);
        if (!res.ok) throw new Error('خطا در شروع فرآیند ورود');
        const { loginUrl, state } = await res.json();
        sessionStorage.setItem('loginState', state);
        return loginUrl;
    };

    const login = async () => {
        try {
            const loginUrl = await initiateLogin();
            window.location.href = loginUrl;
        } catch (error) {
            console.error('Login initiation failed:', error);
        }
    };

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