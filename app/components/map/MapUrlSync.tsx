'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useMap, useMapEvents } from 'react-leaflet';
import { mapController } from '@/app/utils/mapController';

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

function updateUrlCoords(lat: number, lng: number, zoom: number) {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    url.searchParams.set('lat', lat.toFixed(6));
    url.searchParams.set('lng', lng.toFixed(6));
    url.searchParams.set('zoom', zoom.toString());
    window.history.replaceState({}, '', url.toString());
}

export default function MapUrlSync() {
    const map = useMap();
    const initDone = useRef(false);

    useEffect(() => {
        if (initDone.current) return;
        initDone.current = true;
        const { lat, lng, zoom } = readUrlCoords();
        const center = map.getCenter();
        if (Math.abs(center.lat - lat) > 0.000001 || Math.abs(center.lng - lng) > 0.000001 || map.getZoom() !== zoom) {
            map.setView([lat, lng], zoom, { animate: false });
        }
    }, [map]);

    useMapEvents({
        moveend: () => {
            const c = map.getCenter();
            updateUrlCoords(c.lat, c.lng, map.getZoom());
        },
    });

    const flyTo = useCallback((lat: number, lng: number, zoom?: number) => {
        map.setView([lat, lng], zoom ?? map.getZoom(), { animate: true, duration: 1 });
    }, [map]);

    useEffect(() => {
        mapController.flyTo = flyTo;
        return () => { mapController.flyTo = null; };
    }, [flyTo]);

    return null;
}
