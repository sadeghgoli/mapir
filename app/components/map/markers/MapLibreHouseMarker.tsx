'use client';

import { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import { useMapLibre } from '@/app/contexts/MapLibreMapContext';

export default function MapLibreHouseMarker() {
    const map = useMapLibre();
    const [isMounted, setIsMounted] = useState(false);
    const markerRef = useRef<maplibregl.Marker | null>(null);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (!map || !isMounted) return;

        const el = document.createElement('div');
        el.className = 'marker-house';
        const inner = document.createElement('div');
        inner.className = 'marker-house-inner';
        el.appendChild(inner);

        markerRef.current = new maplibregl.Marker({ element: el })
            .setLngLat([51.3845, 35.6888])
            .addTo(map);

        return () => {
            if (markerRef.current) {
                markerRef.current.remove();
                markerRef.current = null;
            }
        };
    }, [map, isMounted]);

    return null;
}
