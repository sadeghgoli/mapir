'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function AuthCallbackPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { apiRequest, refreshToken } = useAuth();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const handleCallback = async () => {
            const token = searchParams.get('token');
            const code = searchParams.get('code');
            const state = searchParams.get('state');
            const errorParam = searchParams.get('error');

            if (errorParam) {
                setError(errorParam);
                setTimeout(() => router.push('/'), 3000);
                return;
            }

            if (!state) {
                setError('State parameter missing');
                setTimeout(() => router.push('/'), 3000);
                return;
            }

            const savedState = sessionStorage.getItem('loginState');
            if (state !== savedState) {
                setError('State validation failed');
                setTimeout(() => router.push('/'), 3000);
                return;
            }
            sessionStorage.removeItem('loginState');

            if (!token && !code) {
                setError('No token or code received');
                setTimeout(() => router.push('/'), 3000);
                return;
            }

            try {
                // اگر توکن مستقیم آمده، ذخیره می‌کنیم
                if (token) {
                    localStorage.setItem('accessToken', token);
                    await refreshToken(); // برای گرفتن user info از /me
                }
                // اگر کد آمده، باید با بک‌اند صحبت کنیم (طبق مستندات callback خود بک‌اند توکن می‌دهد)
                // در اینجا فرض می‌کنیم بک‌اند قبلاً توکن را برگردانده، پس فقط ذخیره می‌کنیم.
                // اگر نیاز به تبادل کد دارید، باید یک endpoint دیگر بزنید.

                router.push('/');
            } catch (err) {
                console.error(err);
                setError('خطا در پردازش ورود');
                setTimeout(() => router.push('/'), 3000);
            }
        };

        handleCallback();
    }, [searchParams, router, refreshToken]);

    return (
        <div className="flex items-center justify-center h-screen bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
                {error ? (
                    <>
                        <h2 className="text-red-600 text-xl mb-2">خطا در ورود</h2>
                        <p>{error}</p>
                        <p className="text-sm text-gray-500 mt-4">در حال انتقال به صفحه اصلی...</p>
                    </>
                ) : (
                    <>
                        <h2 className="text-green-600 text-xl mb-2">در حال ورود...</h2>
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mt-4"></div>
                    </>
                )}
            </div>
        </div>
    );
}