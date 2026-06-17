// app/auth/callback/page.tsx
'use client';

import { useEffect, Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function CallbackContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');

    useEffect(() => {
        const handleCallback = async () => {
            const tokenParam = searchParams.get('token');
            const errorParam = searchParams.get('error');
            const errorDescription = searchParams.get('error_description');

            if (errorParam) {
                setError(errorDescription || errorParam);
                setStatus('error');
                setTimeout(() => router.push('/'), 2000);
                return;
            }

            if (!tokenParam) {
                setError('توکن ورود یافت نشد');
                setStatus('error');
                return;
            }

            try {
                const token = decodeURIComponent(tokenParam);
                const API_BASE = 'https://apiweb-payonmap.sabzevar.ir:8446';

                const response = await fetch(`${API_BASE}/api/auth/me`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error('توکن دریافتی معتبر نیست');
                }

                const result = await response.json();
                
                // ✅ استخراج user از result.data یا result مستقیم
                const userData = result.data || result;

                // ✅ ذخیره با کلید یکسان که AuthContext استفاده می‌کنه
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify({
                    id: userData.id,
                    name: userData.name,
                    phone: userData.phone,
                    email: userData.email || '',
                    avatar: userData.avatar || ''
                }));

                // ✅ trigger کردن storage event برای AuthContext
                window.dispatchEvent(new StorageEvent('storage', {
                    key: 'token',
                    newValue: token,
                    storageArea: localStorage
                }));

                setStatus('success');
                setTimeout(() => router.push('/'), 1000);

            } catch (err) {
                console.error('خطا در پردازش توکن:', err);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setError(err instanceof Error ? err.message : 'خطا در پردازش اطلاعات ورود');
                setStatus('error');
            }
        };

        handleCallback();
    }, [searchParams, router]);

    if (status === 'error') {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100" dir="rtl">
                <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md mx-4">
                    <div className="text-red-500 mb-4">
                        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h2 className="text-red-600 text-xl font-bold mb-2">خطا در ورود</h2>
                    <p className="text-gray-700 mb-4">{error || 'خطای ناشناخته رخ داده است'}</p>
                    <p className="text-sm text-gray-500">در حال انتقال به صفحه اصلی...</p>
                </div>
            </div>
        );
    }

    if (status === 'success') {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100" dir="rtl">
                <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md mx-4">
                    <div className="text-green-500 mb-4">
                        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-green-600 text-xl font-bold mb-2">ورود موفقیت‌آمیز</h2>
                    <p className="text-gray-700 mb-4">شما با موفقیت وارد حساب کاربری خود شدید</p>
                    <p className="text-sm text-gray-500">در حال انتقال به صفحه اصلی...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100" dir="rtl">
            <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md mx-4">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-800 mx-auto mb-4"></div>
                <h2 className="text-gray-800 text-xl font-bold mb-2">در حال ورود به حساب کاربری</h2>
                <p className="text-gray-500 text-sm">لطفاً چند لحظه صبر کنید...</p>
            </div>
        </div>
    );
}

export default function AuthCallbackPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen bg-gray-100" dir="rtl">
                <div className="bg-white p-8 rounded-lg shadow-md text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-800 mx-auto mb-4"></div>
                    <p className="text-gray-600">در حال بارگذاری...</p>
                </div>
            </div>
        }>
            <CallbackContent />
        </Suspense>
    );
}