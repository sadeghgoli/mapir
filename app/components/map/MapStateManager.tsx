'use client';

import { useEffect, useRef } from 'react';
import { useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
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
            const latStr = e.latlng.lat.toFixed(6);
            const lngStr = e.latlng.lng.toFixed(6);
            addPoint('marker', `${latStr},${lngStr}`);
            mapController.onMapClick(e.latlng.lat, e.latlng.lng);

            const coordText = latStr + ', ' + lngStr;
            const escaped = coordText.replace(/'/g, "\\'");
            const popupHtml = '<div style="text-align:center;direction:rtl;font-family:IRANSans,sans-serif;min-width:220px;padding:4px">' +
                '<div style="font-size:13px;color:#666;margin-bottom:8px">مختصات نقطه انتخاب شده</div>' +
                '<div style="font-size:15px;font-family:monospace;background:#f3f4f6;padding:8px 12px;border-radius:8px;margin-bottom:10px;direction:ltr">' + coordText + '</div>' +
                '<button onclick="var t=\'' + escaped + '\',btn=this;navigator.clipboard.writeText(t).then(function(){btn.textContent=\'کپی شد ✓\';setTimeout(function(){btn.textContent=\'کپی مختصات\'},2000)}).catch(function(){var ta=document.createElement(\'textarea\');ta.value=t;document.body.appendChild(ta);ta.select();document.execCommand(\'copy\');document.body.removeChild(ta);btn.textContent=\'کپی شد ✓\';setTimeout(function(){btn.textContent=\'کپی مختصات\'},2000)})" style="width:100%;padding:8px 16px;background:#2563eb;color:white;border:none;border-radius:8px;cursor:pointer;font-size:13px;font-family:IRANSans,sans-serif">کپی مختصات</button>' +
                '</div>';
            L.popup()
                .setLatLng(e.latlng)
                .setContent(popupHtml)
                .openOn(map);
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
