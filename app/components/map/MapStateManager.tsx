'use client';

import { useEffect, useRef } from 'react';
import { useMap, useMapEvents } from 'react-leaflet';
import { mapController } from '@/app/utils/mapController';
import { updateUrl, readCoord, addPoint, removeAllPoints, migrateLegacyParams } from '@/app/utils/urlManager';

const DEFAULT_LAT = 36.21;
const DEFAULT_LNG = 57.667;
const DEFAULT_ZOOM = 18;

export default function MapStateManager() {
    const map = useMap();
    const initDone = useRef(false);

    useEffect(() => {
        if (initDone.current) return;
        initDone.current = true;

        migrateLegacyParams();

        const lat = readCoord('lat', DEFAULT_LAT);
        const lng = readCoord('lng', DEFAULT_LNG);
        const zoom = readCoord('zoom', DEFAULT_ZOOM);
        const center = map.getCenter();
        const dz = map.getZoom();

        if (Math.abs(center.lat - lat) > 1e-8 || Math.abs(center.lng - lng) > 1e-8 || dz !== zoom) {
            map.setView([lat, lng], zoom, { animate: false });
        }
    }, [map]);

    useMapEvents({
        moveend: () => {
            const c = map.getCenter();
            updateUrl({
                lat: c.lat.toFixed(6),
                lng: c.lng.toFixed(6),
                zoom: map.getZoom().toString(),
            });
        },
        click: (e) => {
            const target = e.originalEvent?.target as HTMLElement | null;
            if (target && !target.closest('.leaflet-pane') && !target.classList.contains('leaflet-container')) return;
            removeAllPoints('marker');
            addPoint('marker', `${e.latlng.lat.toFixed(6)},${e.latlng.lng.toFixed(6)}`);
            mapController.onMapClick(e.latlng.lat, e.latlng.lng);
        },
    });

    useEffect(() => {
        mapController.flyTo = (lat, lng, zoom) => {
            map.setView([lat, lng], zoom ?? map.getZoom(), { animate: true, duration: 1 });
        };
        return () => { mapController.flyTo = null; };
    }, [map]);

    return null;
}
