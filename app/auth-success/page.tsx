// app/auth-success/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AuthSuccessPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const dataParam = searchParams.get('data');
        
        if (dataParam) {
            try {
                // دیکود کردن داده
                const decodedData = atob(dataParam);
                const separatorIndex = decodedData.indexOf('|');
                
                if (separatorIndex > 0) {
                    const token = decodedData.substring(0, separatorIndex);
                    const userJson = decodedData.substring(separatorIndex + 1);
                    const user = JSON.parse(userJson);
                    
                    // ذخیره در localStorage
                    localStorage.setItem('accessToken', token);
                    localStorage.setItem('user', userJson);
                    
                    // ریدایرکت به صفحه اصلی با یک پارامتر نشانگر لاگین
                    router.push('/?login=success');
                } else {
                    router.push('/?login=error');
                }
            } catch (error) {
                console.error('Error parsing auth data:', error);
                router.push('/?login=error');
            }
        } else {
            router.push('/?login=error');
        }
    }, [router, searchParams]);

    return (
        <div className="flex justify-center items-center h-screen">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-800 mx-auto"></div>
                <p className="mt-4 text-gray-600">در حال انتقال به صفحه اصلی...</p>
            </div>
        </div>
    );
}