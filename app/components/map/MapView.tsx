'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useLayer } from '@/app/contexts/LayerContext';
import { NOSAZI_LAYER_ID, NOSAZI_DEFAULT_ZOOM, NOSAZI_MIN_LOAD_ZOOM } from '@/app/constants/layers';

// ===== OLD LEAFLET IMPLEMENTATION =====
/*
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
import MapLegend from './overlays/MapLegend';

const UserLocationMarker = dynamic(() => import('./markers/UserLocationMarker'), { ssr: false });

const KoocheLayer = dynamic(() => import('./layers/KoocheLayer'), { ssr: false });
const MokebLayer = dynamic(() => import('./layers/MokebLayer'), { ssr: false });
const MapUrlSync = dynamic(() => import('./MapUrlSync'), { ssr: false });
const PositionMarker = dynamic(() => import('./PositionMarker'), { ssr: false });
*/
// ===== END OLD LEAFLET IMPLEMENTATION =====

// ===== NEW MAPLIBRE IMPLEMENTATION =====
const MapLibreProvider = dynamic(
    () => import('@/app/contexts/MapLibreMapContext').then((mod) => mod.MapLibreProvider),
    { ssr: false }
);
const MapLibreMapStateManager = dynamic(() => import('./MapLibreMapStateManager'), { ssr: false });
const MapLibreBaseTileLayer = dynamic(() => import('./layers/MapLibreBaseTileLayer'), { ssr: false });
const MapLibreNosaziLayer = dynamic(() => import('./layers/MapLibreNosaziLayer'), { ssr: false });
const MapLibreKoocheLayer = dynamic(() => import('./layers/MapLibreKoocheLayer'), { ssr: false });
const MapLibreMokebLayer = dynamic(() => import('./layers/MapLibreMokebLayer'), { ssr: false });
const MapLibrePositionMarker = dynamic(() => import('./MapLibrePositionMarker'), { ssr: false });
const MapLibreUserLocationMarker = dynamic(() => import('./markers/MapLibreUserLocationMarker'), { ssr: false });
import ZoomControls from './overlays/ZoomControls';
import MapLegend from './overlays/MapLegend';
// ===== END NEW MAPLIBRE IMPLEMENTATION =====

function readUrlCoords(): { lat: number; lng: number; zoom: number } {
    if (typeof window === 'undefined') return { lat: 36.21, lng: 57.667, zoom: 18 };
    const params = new URLSearchParams(window.location.search);
    const lat = parseFloat(params.get('lat') || '');
    const lng = parseFloat(params.get('lng') || '');
    let zoom = parseInt(params.get('zoom') || '');
    const layers = (params.get('layers') || '').split(',').filter(Boolean);
    const hasNosazi = layers.includes(NOSAZI_LAYER_ID);

    // با لایه عوارض، زوم باید برای لود داده کافی باشد
    if (hasNosazi && (isNaN(zoom) || zoom < NOSAZI_MIN_LOAD_ZOOM)) {
        zoom = NOSAZI_DEFAULT_ZOOM;
    }

    return {
        lat: !isNaN(lat) && lat >= -90 && lat <= 90 ? lat : 36.21,
        lng: !isNaN(lng) && lng >= -180 && lng <= 180 ? lng : 57.667,
        zoom: !isNaN(zoom) && zoom >= 1 && zoom <= 20 ? zoom : NOSAZI_DEFAULT_ZOOM,
    };
}

function MapComponent() {
    const [isMounted, setIsMounted] = useState(false);
    const [isLoadingNosazi, setIsLoadingNosazi] = useState(false);
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
    const { activeLayers, availableLayers } = useLayer();
    const initialCoords = useRef(readUrlCoords());

    const isLayerActive = (componentName: string) =>
        activeLayers.length > 0 && availableLayers.some(
            l => activeLayers.includes(l.id) && l.componentName === componentName
        );

    const handleUserLocated = useCallback((lat: number, lng: number) => {
        setUserLocation([lat, lng]);
    }, []);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return <div className="w-full h-full bg-gray-100" />;
    }

    return (
        <div className="relative w-full h-full">
            {/* ===== OLD LEAFLET IMPLEMENTATION ===== */}
            {/*
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
                {userLocation && <UserLocationMarker position={userLocation} />}
                <ZoomControls onUserLocated={handleUserLocated} />
            </MapContainer>
            */}
            {/* ===== END OLD LEAFLET IMPLEMENTATION ===== */}

            {/* ===== NEW MAPLIBRE IMPLEMENTATION ===== */}
            <MapLibreProvider
                center={[initialCoords.current.lat, initialCoords.current.lng]}
                zoom={initialCoords.current.zoom}
            >
                <MapLibreBaseTileLayer />
                <MapLibreMapStateManager />

                {isLayerActive('NosaziLayer') && (
                    <MapLibreNosaziLayer onLoadingChange={setIsLoadingNosazi} />
                )}
                {isLayerActive('KoocheLayer') && <MapLibreKoocheLayer />}
                {isLayerActive('MokebLayer') && <MapLibreMokebLayer />}

                <MapLibrePositionMarker />
                {userLocation && <MapLibreUserLocationMarker position={userLocation} />}
                <ZoomControls onUserLocated={handleUserLocated} />
            </MapLibreProvider>
            {/* ===== END NEW MAPLIBRE IMPLEMENTATION ===== */}

            <MapLegend />

            {isLoadingNosazi && (
                <div className="absolute bottom-4 left-4 z-[2000] pointer-events-none">
                    <div className="bg-white/90 rounded-full shadow-lg p-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-[3px] border-gray-200 border-t-blue-600"></div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default dynamic(() => Promise.resolve(MapComponent), {
    ssr: false,
});
