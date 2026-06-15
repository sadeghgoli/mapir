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
            const tokenParam = searchParams.get('accessToken') || searchParams.get('token');
            const stateParam = searchParams.get('state');
            const errorParam = searchParams.get('error');
            const errorDescription = searchParams.get('error_description');

            // ۱. بررسی خطا از سمت درگاه لاگین
            if (errorParam) {
                setError(errorDescription || errorParam);
                setStatus('error');
                setTimeout(() => {
                    if (window.opener) {
                        window.close();
                    } else {
                        router.push('/');
                    }
                }, 3000);
                return;
            }

            // ۲. اعتبارسنجی state parameter برای جلوگیری از CSRF
            const savedState = sessionStorage.getItem('loginState');
            if (stateParam && savedState && stateParam !== savedState) {
                setError('State parameter نامعتبر است');
                setStatus('error');
                setTimeout(() => {
                    if (window.opener) {
                        window.close();
                    } else {
                        router.push('/');
                    }
                }, 3000);
                return;
            }
            sessionStorage.removeItem('loginState');
            sessionStorage.removeItem('loginPopupState');

            // ۳. پردازش توکن دریافتی
            if (tokenParam) {
                try {
                    const token = decodeURIComponent(tokenParam);

                    // ذخیره توکن در localStorage
                    localStorage.setItem('accessToken', token);

                    // دریافت اطلاعات کاربر برای تایید اعتبار توکن
                    const API_BASE = 'https://apiweb-payonmap.sabzevar.ir:8446';
                    const response = await fetch(`${API_BASE}/api/Auth/me`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    if (response.ok) {
                        const userData = await response.json();

                        // اگر صفحه در popup باز شده است
                        if (window.opener && !window.opener.closed) {
                            // ارسال اطلاعات به صفحه اصلی از طریق postMessage
                            window.opener.postMessage({
                                type: 'LOGIN_SUCCESS',
                                accessToken: token,
                                user: userData
                            }, window.location.origin);

                            setStatus('success');

                            // بستن popup بعد از 1 ثانیه
                            setTimeout(() => {
                                window.close();
                            }, 1000);
                        } else {
                            // اگر popup نیست، ریدایرکت به صفحه اصلی
                            setStatus('success');
                            setTimeout(() => {
                                router.push('/');
                            }, 1000);
                        }
                    } else {
                        // توکن نامعتبر است
                        localStorage.removeItem('accessToken');
                        throw new Error('توکن دریافتی معتبر نیست');
                    }
                } catch (err) {
                    console.error('خطا در پردازش توکن:', err);
                    setError(err instanceof Error ? err.message : 'خطا در پردازش اطلاعات ورود');
                    setStatus('error');

                    // پاکسازی توکن نامعتبر
                    localStorage.removeItem('accessToken');

                    setTimeout(() => {
                        if (window.opener && !window.opener.closed) {
                            window.opener.postMessage({
                                type: 'LOGIN_ERROR',
                                error: 'خطا در پردازش ورود'
                            }, window.location.origin);
                            window.close();
                        } else {
                            router.push('/');
                        }
                    }, 3000);
                }
            } else {
                // بدون توکن - خطا
                setError('توکن ورود یافت نشد');
                setStatus('error');
                setTimeout(() => {
                    if (window.opener && !window.opener.closed) {
                        window.close();
                    } else {
                        router.push('/');
                    }
                }, 3000);
            }
        };

        handleCallback();
    }, [searchParams, router]);

    // نمایش وضعیت‌های مختلف
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
                    <p className="text-sm text-gray-500">در حال بستن صفحه...</p>
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
                    <p className="text-sm text-gray-500">در حال بستن صفحه...</p>
                </div>
            </div>
        );
    }

    // وضعیت processing
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