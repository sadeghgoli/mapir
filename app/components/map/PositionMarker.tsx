'use client';

import { useEffect, useRef, useState } from 'react';
import { useMap, useMapEvents, Marker } from 'react-leaflet';
import { divIcon } from 'leaflet';
import { getUrlParams } from '@/app/utils/urlManager';

function readMarkerFromUrl(): [number, number] | null {
    const p = getUrlParams();
    const mlat = parseFloat(p.mlat || '');
    const mlng = parseFloat(p.mlng || '');
    if (!isNaN(mlat) && !isNaN(mlng) && mlat >= -90 && mlat <= 90 && mlng >= -180 && mlng <= 180) {
        return [mlat, mlng];
    }
    return null;
}

const markerIcon = divIcon({
    className: '',
    html: `<div style="
        width: 24px; height: 24px;
        background: #2563eb;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(37,99,235,0.4);
        display: flex; align-items: center; justify-content: center;
    "><div style="
        width: 8px; height: 8px;
        background: white;
        border-radius: 50%;
    "></div></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
});

export default function PositionMarker() {
    const map = useMap();
    const [position, setPosition] = useState<[number, number] | null>(null);
    const initDone = useRef(false);

    useEffect(() => {
        if (initDone.current) return;
        initDone.current = true;
        const urlMarker = readMarkerFromUrl();
        setPosition(urlMarker ?? [map.getCenter().lat, map.getCenter().lng]);
    }, [map]);

    useMapEvents({
        moveend: () => {
            const c = map.getCenter();
            setPosition([c.lat, c.lng]);
        },
        click: (e) => {
            setPosition([e.latlng.lat, e.latlng.lng]);
        },
    });

    if (!position) return null;

    return (
        <Marker position={position} icon={markerIcon} />
    );
}
