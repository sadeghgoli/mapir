import { useState, useEffect, useCallback } from 'react';

interface SSOUser {
    id: string;
    name: string;
    phone: string;
}

interface SSOResult {
    success: boolean;
    token?: string;
    error?: string;
    user?: SSOUser;
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

const SSO_LOGIN_URL = 'https://apiweb-payonmap.sabzevar.ir:8446/api/auth/login';
const TOKEN_KEY = 'sso_access_token';
const USER_KEY = 'sso_user';

export function useSSO(): UseSSOReturn {
    const [isLoading, setIsLoading] = useState(false);
    const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
    const [user, setUser] = useState<SSOUser | null>(() => {
        const saved = localStorage.getItem(USER_KEY);
        return saved ? JSON.parse(saved) : null;
    });
    const [error, setError] = useState<string | null>(null);

    const handleMessage = useCallback((event: MessageEvent) => {
        // فقط پیام‌های از همین دامنه یا دامنه SSO رو قبول کن
        const result = event.data as SSOResult;
        if (!result || typeof result.success === 'undefined') return;

        setIsLoading(false);

        if (result.success && result.token) {
            setToken(result.token);
            setUser(result.user ?? null);
            setError(null);
            localStorage.setItem(TOKEN_KEY, result.token);
            if (result.user) {
                localStorage.setItem(USER_KEY, JSON.stringify(result.user));
            }
        } else {
            setError(result.error ?? 'خطا در ورود');
        }
    }, []);

    useEffect(() => {
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [handleMessage]);

    const login = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            // دریافت URL لاگین از API
            const res = await fetch(SSO_LOGIN_URL);
            const data = await res.json();

            // باز کردن popup
            const popup = window.open(
                data.loginUrl,
                'SSO_Login',
                'width=500,height=600,top=100,left=100,resizable=yes,scrollbars=yes'
            );

            if (!popup) {
                setError('مرورگر popup را مسدود کرده است. لطفاً اجازه دهید.');
                setIsLoading(false);
                return;
            }

            // اگه popup بسته شد ولی پیامی نرسید
            const checkClosed = setInterval(() => {
                if (popup.closed) {
                    clearInterval(checkClosed);
                    setIsLoading(false);
                }
            }, 500);

        } catch (err) {
            setError('خطا در اتصال به سرور');
            setIsLoading(false);
        }
    }, []);

    const logout = useCallback(() => {
        setToken(null);
        setUser(null);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);

        // revoke از سرور
        fetch('https://apiweb-payonmap.sabzevar.ir:8446/api/auth/logout', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            credentials: 'include'
        }).catch(() => {});
    }, [token]);

    return {
        login,
        logout,
        isLoading,
        isLoggedIn: !!token,
        user,
        token,
        error
    };
}