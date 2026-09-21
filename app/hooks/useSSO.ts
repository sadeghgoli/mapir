// app/hooks/useSSO.ts — prefer AuthContext; kept for legacy imports.

'use client';

import { useState, useEffect, useCallback } from 'react';
import { authService } from '@/app/services/auth.service';

interface SSOUser {
    id: string;
    name: string;
    phone: string;
}

interface UseSSOReturn {
    login: () => void;
    logout: () => void;
    isLoading: boolean;
    isLoggedIn: boolean;
    user: SSOUser | null;
    token: string | null;
    error: string | null;
}

const TOKEN_KEY = 'token';

export function useSSO(): UseSSOReturn {
    const [isLoading, setIsLoading] = useState(false);
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<SSOUser | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const storedToken = localStorage.getItem(TOKEN_KEY);
        const storedUser = localStorage.getItem('user');

        setToken(storedToken);
        setUser(storedUser ? JSON.parse(storedUser) : null);
    }, []);

    const login = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            window.location.href = authService.getPortalLoginUrl();
        } catch {
            setError('خطا در شروع ورود');
            setIsLoading(false);
        }
    }, []);

    const logout = useCallback(async () => {
        await authService.logout();
        setToken(null);
        setUser(null);
    }, []);

    if (!mounted) {
        return {
            login: () => {},
            logout: () => {},
            isLoading: true,
            isLoggedIn: false,
            user: null,
            token: null,
            error: null,
        };
    }

    return {
        login,
        logout,
        isLoading,
        isLoggedIn: !!token && !!user,
        user,
        token,
        error,
    };
}
