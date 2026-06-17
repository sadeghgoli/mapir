// app/auth-error/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AuthErrorPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        setTimeout(() => {
            router.push('/');
        }, 3000);
    }, [router]);

    const error = searchParams.get('error');

    return (
        <div className="flex justify-center items-center h-screen">
            <div className="text-center">
                <div className="text-red-500 text-6xl mb-4">✗</div>
                <h1 className="text-xl font-bold mb-2">خطا در ورود</h1>
                <p className="text-gray-600">{error || 'خطای ناشناخته رخ داده است'}</p>
                <p className="text-sm text-gray-400 mt-4">در حال بازگشت به صفحه اصلی...</p>
            </div>
        </div>
    );
}