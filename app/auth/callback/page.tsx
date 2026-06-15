// app/auth/callback/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';

export default function AuthCallbackPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { login, user, updateUser, isLoading } = useAuth();
    const [error, setError] = useState<string | null>(null);
    const [processing, setProcessing] = useState(true);

    useEffect(() => {
        const handleCallback = async () => {
            const tokenParam = searchParams.get('token');
            const stateParam = searchParams.get('state');
            const errorParam = searchParams.get('error');

            // ۱. بررسی خطا از سمت درگاه لاگین
            if (errorParam) {
                setError(errorParam);
                setProcessing(false);
                setTimeout(() => router.push('/'), 3000);
                return;
            }

            // ۲. اعتبارسنجی state parameter برای جلوگیری از CSRF
            const savedState = sessionStorage.getItem('loginState');
            if (stateParam !== savedState) {
                setError('State parameter نامعتبر است');
                setProcessing(false);
                setTimeout(() => router.push('/'), 3000);
                return;
            }
            sessionStorage.removeItem('loginState');

            // ۳. دریافت و ذخیره توکن از پارامترهای URL یا لاگین خودکار
            if (tokenParam) {
                try {
                    const token = decodeURIComponent(tokenParam);
                    localStorage.setItem('accessToken', token);

                    // دریافت اطلاعات کاربر با توکن جدید
                    const API_BASE = 'https://apiweb-payonmap.sabzevar.ir:8446';
                    const response = await fetch(`${API_BASE}/api/Auth/me`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                    if (response.ok) {
                        const userData = await response.json();
                        updateUser(userData);
                    }

                    router.push('/');
                } catch (err) {
                    console.error('خطا در پردازش توکن:', err);
                    setError('خطا در پردازش اطلاعات ورود');
                    setProcessing(false);
                    setTimeout(() => router.push('/'), 3000);
                }
            }
            // ۴. در صورت نبود توکن، ممکن است لاگین از طریق provider انجام شده باشد
            else if (!user && !isLoading) {
                await login();
            } else {
                router.push('/');
            }
        };

        handleCallback();
    }, [searchParams, router, login, user, isLoading, updateUser]);

    if (error) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-100">
                <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
                    <h2 className="text-red-600 text-xl mb-4">خطا در ورود</h2>
                    <p className="text-gray-700 mb-4">{error}</p>
                    <p className="text-sm text-gray-500">در حال انتقال به صفحه اصلی...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center h-screen bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-800 mx-auto mb-4"></div>
                <h2 className="text-gray-800 text-xl">در حال ورود به حساب کاربری...</h2>
                <p className="text-gray-500 text-sm mt-2">لطفاً چند لحظه صبر کنید</p>
            </div>
        </div>
    );
}