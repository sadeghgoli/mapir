'use client';

import { useEffect } from 'react';
import { trackVisit } from '@/app/utils/visitTracker';

export default function VisitTracker() {
    useEffect(() => {
        trackVisit();
    }, []);

    return null;
}
