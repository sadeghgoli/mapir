'use client';

import { useEffect, useRef, useState } from 'react';
import { useMap, useMapEvents, Marker } from 'react-leaflet';
import { divIcon } from 'leaflet';

function readMarkerFromUrl(): [number, number] | null {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    const mlat = parseFloat(params.get('mlat') || '');
    const mlng = parseFloat(params.get('mlng') || '');
    if (!isNaN(mlat) && !isNaN(mlng) && mlat >= -90 && mlat <= 90 && mlng >= -180 && mlng <= 180) {
        return [mlat, mlng];
    }
    return null;
}

function writeMarkerToUrl(lat: number, lng: number) {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    url.searchParams.set('mlat', lat.toFixed(6));
    url.searchParams.set('mlng', lng.toFixed(6));
    window.history.replaceState({}, '', url.toString());
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
        if (urlMarker) {
            setPosition(urlMarker);
        } else {
            const c = map.getCenter();
            setPosition([c.lat, c.lng]);
            writeMarkerToUrl(c.lat, c.lng);
        }
    }, [map]);

    useMapEvents({
        moveend: () => {
            const c = map.getCenter();
            setPosition([c.lat, c.lng]);
            writeMarkerToUrl(c.lat, c.lng);
        },
        click: (e) => {
            const { lat, lng } = e.latlng;
            setPosition([lat, lng]);
            writeMarkerToUrl(lat, lng);
        },
    });

    if (!position) return null;

    return (
        <Marker position={position} icon={markerIcon} />
    );
}
