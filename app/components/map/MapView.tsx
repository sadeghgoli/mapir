'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

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

const CENTER: [number, number] = [36.21, 57.667];

function MapComponent() {
    const [isMounted, setIsMounted] = useState(false);

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
                zoom={14}
                zoomControl={false}
                className="w-full h-full z-0"
                style={{ background: '#f0f0f0' }}
            >
                <BaseTileLayer />
                <NosaziLayer />
                <ZoomControls />
            </MapContainer>
        </div>
    );
}

export default dynamic(() => Promise.resolve(MapComponent), {
    ssr: false,
});