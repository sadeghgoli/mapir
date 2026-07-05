'use client';

import dynamic from 'next/dynamic';

const MapStateManager = dynamic(() => import('./MapStateManager'), { ssr: false });

export default function MapUrlSync() {
    return <MapStateManager />;
}
