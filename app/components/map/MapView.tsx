'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { useLayer } from '@/app/contexts/LayerContext';

// Import پویا با تنظیمات کامل
const MapContainer = dynamic(
    () => import('react-leaflet').then((mod) => mod.MapContainer),
    {
        ssr: false,
        loading: () => <div className="w-full h-full bg-gray-100" />
    }
);

import BaseTileLayer from './layers/BaseTileLayer';
import NosaziLayer from './layers/NosaziLayer';
import ZoomControls from './overlays/ZoomControls';

const KoocheLayer = dynamic(
    () => import('./layers/KoocheLayer'),
    { ssr: false }
);

const ImportantPointsLayer = dynamic(
    () => import('./layers/ImportantPointsLayer'),
    { ssr: false }
);

const CENTER: [number, number] = [36.21, 57.667];

function MapComponent() {
    const [isMounted, setIsMounted] = useState(false);
    const [isLoadingNosazi, setIsLoadingNosazi] = useState(false);
    const { activeLayer } = useLayer();

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return <div className="w-full h-full bg-gray-100" />;
    }

    return (
        <div className="relative w-full h-full">
            <MapContainer
                center={CENTER}
                zoom={18}
                zoomControl={false}
                className="w-full h-full z-0"
                style={{ background: '#f0f0f0' }}
            >
                <BaseTileLayer />

                {activeLayer === 'toll' && (
                    <NosaziLayer onLoadingChange={setIsLoadingNosazi} />
                )}
                {activeLayer === 'kooche' && <KoocheLayer />}
                {activeLayer === 'points' && <ImportantPointsLayer />}

                <ZoomControls />
            </MapContainer>

            {/* لودر سراسری روی نقشه */}
            {isLoadingNosazi && (
                <div className="absolute inset-0 flex items-center justify-center z-[2000] bg-black/20 backdrop-blur-sm pointer-events-none">
                    <div className="bg-white rounded-lg shadow-xl p-4 flex items-center gap-3 pointer-events-auto" dir="rtl">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <span className="text-gray-700 font-medium">در حال بارگذاری داده‌های نوسازی...</span>
                    </div>
                </div>
            )}
        </div>
    );
}

export default dynamic(() => Promise.resolve(MapComponent), {
    ssr: false,
});