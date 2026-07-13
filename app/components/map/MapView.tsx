'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState, useRef } from 'react';
import { useLayer } from '@/app/contexts/LayerContext';

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

const KoocheLayer = dynamic(() => import('./layers/KoocheLayer'), { ssr: false });
const MokebLayer = dynamic(() => import('./layers/MokebLayer'), { ssr: false });
const MapUrlSync = dynamic(() => import('./MapUrlSync'), { ssr: false });
const PositionMarker = dynamic(() => import('./PositionMarker'), { ssr: false });

function readUrlCoords(): { lat: number; lng: number; zoom: number } {
    if (typeof window === 'undefined') return { lat: 36.21, lng: 57.667, zoom: 18 };
    const params = new URLSearchParams(window.location.search);
    const lat = parseFloat(params.get('lat') || '');
    const lng = parseFloat(params.get('lng') || '');
    const zoom = parseInt(params.get('zoom') || '');
    return {
        lat: !isNaN(lat) && lat >= -90 && lat <= 90 ? lat : 36.21,
        lng: !isNaN(lng) && lng >= -180 && lng <= 180 ? lng : 57.667,
        zoom: !isNaN(zoom) && zoom >= 1 && zoom <= 20 ? zoom : 18,
    };
}

function MapComponent() {
    const [isMounted, setIsMounted] = useState(false);
    const [isLoadingNosazi, setIsLoadingNosazi] = useState(false);
    const { activeLayers, availableLayers } = useLayer();
    const initialCoords = useRef(readUrlCoords());

    const isLayerActive = (componentName: string) =>
        activeLayers.length > 0 && availableLayers.some(
            l => activeLayers.includes(l.id) && l.componentName === componentName
        );

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return <div className="w-full h-full bg-gray-100" />;
    }

    return (
        <div className="relative w-full h-full">
            <MapContainer
                center={[initialCoords.current.lat, initialCoords.current.lng]}
                zoom={initialCoords.current.zoom}
                zoomControl={false}
                className="w-full h-full z-0"
                style={{ background: '#f0f0f0' }}
            >
                <BaseTileLayer />

                {isLayerActive('NosaziLayer') && (
                    <NosaziLayer key="toll" onLoadingChange={setIsLoadingNosazi} />
                )}
                {isLayerActive('KoocheLayer') && <KoocheLayer key="kooche" />}
                {isLayerActive('MokebLayer') && <MokebLayer key="mokeb" />}

                <MapUrlSync />
                <PositionMarker />
                <ZoomControls />
            </MapContainer>

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
