'use client';

import { useEffect, useState } from 'react';
import { useMapEvents } from 'react-leaflet';

export default function LoadingOverlay() {
    const [isLoading, setIsLoading] = useState(false);

    const map = useMapEvents({
        moveend: () => {
            // منطق شما
        },
        zoomend: () => {
            const zoom = map.getZoom();
            if (zoom < 16) {
                setIsLoading(false);
            }
        }
    });

    if (!isLoading) return null;

    return (
        <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1.5 rounded-md text-sm z-[1000]">
            در حال بارگذاری داده‌های نوسازی...
        </div>
    );
}