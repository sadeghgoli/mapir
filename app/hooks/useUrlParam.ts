// hooks/useUrlParam.ts
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

export function useUrlParam(paramName: string) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const [paramValue, setParamValue] = useState<string | null>(null);

    // دریافت مقدار پارامتر از URL
    useEffect(() => {
        const value = searchParams.get(paramName);
        setParamValue(value);
    }, [searchParams, paramName]);

    // تنظیم مقدار پارامتر در URL
    const updateParam = useCallback((value: string | null) => {
        const params = new URLSearchParams(searchParams.toString());

        if (value) {
            params.set(paramName, value);
        } else {
            params.delete(paramName);
        }

        const newUrl = `${pathname}${params.toString() ? `?${params.toString()}` : ''}`;
        router.push(newUrl, { scroll: false });
    }, [paramName, searchParams, router, pathname]);

    return { paramValue, updateParam };
}