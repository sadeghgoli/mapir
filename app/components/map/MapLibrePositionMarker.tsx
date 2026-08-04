'use client';

import { useEffect, useRef, useState } from 'react';
import { maplibregl } from '@/app/libs/maplibre';
import { useMapLibre } from '@/app/contexts/MapLibreMapContext';
import { getFirstPoint } from '@/app/utils/urlManager';
import { useLayer } from '@/app/contexts/LayerContext';

function readMarkerFromUrl(): [number, number] | null {
    const val = getFirstPoint('marker');
    if (!val) return null;
    const parts = val.split(',').map(s => s.trim());
    if (parts.length !== 2) return null;
    const lat = parseFloat(parts[0]);
    const lng = parseFloat(parts[1]);
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return [lat, lng];
    }
    return null;
}

export default function MapLibrePositionMarker() {
    const map = useMapLibre();
    const { activeLayers } = useLayer();
    const [position, setPosition] = useState<[number, number] | null>(null);
    const initDone = useRef(false);
    const markerRef = useRef<maplibregl.Marker | null>(null);
    const popupRef = useRef<maplibregl.Popup | null>(null);

    useEffect(() => {
        if (!map) return;
        if (initDone.current) return;
        initDone.current = true;
        const urlMarker = readMarkerFromUrl();
        setPosition(urlMarker ?? [map.getCenter().lat, map.getCenter().lng]);
    }, [map]);

    useEffect(() => {
        if (!map) return;

        const handleMoveEnd = () => {
            const urlMarker = readMarkerFromUrl();
            if (urlMarker) {
                setPosition(urlMarker);
            } else {
                const c = map.getCenter();
                setPosition([c.lat, c.lng]);
            }
        };

        const handleClick = (e: maplibregl.MapMouseEvent) => {
            const target = e.originalEvent?.target as HTMLElement | null;
            if (target && target.closest('.maplibregl-marker')) return;
            setPosition([e.lngLat.lat, e.lngLat.lng]);
        };

        map.on('moveend', handleMoveEnd);
        map.on('click', handleClick);

        return () => {
            map.off('moveend', handleMoveEnd);
            map.off('click', handleClick);
        };
    }, [map]);

    useEffect(() => {
        if (markerRef.current) {
            markerRef.current.remove();
            markerRef.current = null;
        }

        if (!position || activeLayers.length > 0) return;

        const el = document.createElement('div');
        el.style.width = '24px';
        el.style.height = '24px';
        el.style.background = '#2563eb';
        el.style.border = '3px solid white';
        el.style.borderRadius = '50%';
        el.style.boxShadow = '0 2px 8px rgba(37,99,235,0.4)';
        el.style.display = 'flex';
        el.style.alignItems = 'center';
        el.style.justifyContent = 'center';

        const inner = document.createElement('div');
        inner.style.width = '8px';
        inner.style.height = '8px';
        inner.style.background = 'white';
        inner.style.borderRadius = '50%';
        el.appendChild(inner);

        markerRef.current = new maplibregl.Marker({ element: el })
            .setLngLat([position[1], position[0]])
            .addTo(map);

        return () => {
            if (markerRef.current) {
                markerRef.current.remove();
                markerRef.current = null;
            }
        };
    }, [map, position, activeLayers]);

    return null;
}
