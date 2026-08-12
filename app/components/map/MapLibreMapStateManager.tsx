'use client';

import { useEffect, useRef } from 'react';
import { maplibregl } from '@/app/libs/maplibre';
import { useMapLibre } from '@/app/contexts/MapLibreMapContext';
import { updateUrl, readCoord, addPoint, removeAllPoints, migrateLegacyParams, getIdParam, getUrlParams } from '@/app/utils/urlManager';
import { useLayer } from '@/app/contexts/LayerContext';
import { mapController } from '@/app/utils/mapController';
import { NOSAZI_LAYER_ID, NOSAZI_DEFAULT_ZOOM, NOSAZI_MIN_LOAD_ZOOM } from '@/app/constants/layers';

const DEFAULT_LAT = 36.21;
const DEFAULT_LNG = 57.667;
const DEFAULT_ZOOM = 18;

const KOCHE_HIT_LAYER = 'kooche-circles-hit';

function resolveInitialZoom(): number {
    const params = getUrlParams();
    const layers = (params.layers || '').split(',').filter(Boolean);
    const hasNosazi = layers.includes(NOSAZI_LAYER_ID);
    let zoom = readCoord('zoom', DEFAULT_ZOOM);
    if (hasNosazi && zoom < NOSAZI_MIN_LOAD_ZOOM) {
        return NOSAZI_DEFAULT_ZOOM;
    }
    return zoom;
}

export default function MapLibreMapStateManager() {
    const map = useMapLibre();
    const { activeLayers } = useLayer();
    const popupRef = useRef<maplibregl.Popup | null>(null);

    useEffect(() => {
        if (!map) return;

        migrateLegacyParams();

        // When opening via feature id, camera comes from alley data — skip lat/lng jump
        if (getIdParam()) return;

        const lat = readCoord('lat', DEFAULT_LAT);
        const lng = readCoord('lng', DEFAULT_LNG);
        const zoom = resolveInitialZoom();
        const center = map.getCenter();
        const currentZoom = map.getZoom();

        if (Math.abs(center.lat - lat) > 1e-8 || Math.abs(center.lng - lng) > 1e-8 || currentZoom !== zoom) {
            map.jumpTo({ center: [lng, lat], zoom });
        }
    }, [map]);

    useEffect(() => {
        if (!map) return;

        const handleMoveEnd = () => {
            // Keep share URLs short: don't persist camera when a feature id is selected
            if (getIdParam()) {
                const params = new URLSearchParams(window.location.search);
                if (params.has('lat') || params.has('lng') || params.has('zoom')) {
                    updateUrl({ lat: null, lng: null, zoom: null });
                }
                return;
            }
            const c = map.getCenter();
            updateUrl({
                lat: c.lat.toFixed(6),
                lng: c.lng.toFixed(6),
                zoom: Math.round(map.getZoom()).toString(),
            });
        };

        const handleClick = (e: maplibregl.MapMouseEvent) => {
            const target = e.originalEvent?.target as HTMLElement | null;
            if (target && target.closest('.maplibregl-marker')) return;

            // Don't add marker when clicking a kooche feature
            if (map.getLayer(KOCHE_HIT_LAYER)) {
                const hits = map.queryRenderedFeatures(e.point, { layers: [KOCHE_HIT_LAYER] });
                if (hits.length > 0) return;
            }

            removeAllPoints('marker');
            const latStr = e.lngLat.lat.toFixed(6);
            const lngStr = e.lngLat.lng.toFixed(6);
            addPoint('marker', `${latStr},${lngStr}`);
            mapController.onMapClick(e.lngLat.lat, e.lngLat.lng);

            if (popupRef.current) popupRef.current.remove();

            if (activeLayers.length === 0) {
                const coordText = latStr + ', ' + lngStr;
                const escaped = coordText.replace(/'/g, "\\'");
                const popupHtml = '<div style="text-align:center;direction:rtl;font-family:IRANSans,sans-serif;min-width:220px;padding:4px">' +
                    '<div style="font-size:13px;color:#666;margin-bottom:8px">مختصات نقطه انتخاب شده</div>' +
                    '<div style="font-size:15px;font-family:monospace;background:#f3f4f6;padding:8px 12px;border-radius:8px;margin-bottom:10px;direction:ltr">' + coordText + '</div>' +
                    '<button onclick="var t=\'' + escaped + '\',btn=this;navigator.clipboard.writeText(t).then(function(){btn.textContent=\'کپی شد ✓\';setTimeout(function(){btn.textContent=\'کپی مختصات\'},2000)}).catch(function(){var ta=document.createElement(\'textarea\');ta.value=t;document.body.appendChild(ta);ta.select();document.execCommand(\'copy\');document.body.removeChild(ta);btn.textContent=\'کپی شد ✓\';setTimeout(function(){btn.textContent=\'کپی مختصات\'},2000)})" style="width:100%;padding:8px 16px;background:#2563eb;color:white;border:none;border-radius:8px;cursor:pointer;font-size:13px;font-family:IRANSans,sans-serif">کپی مختصات</button>' +
                    '</div>';

                popupRef.current = new maplibregl.Popup({ closeButton: true, closeOnClick: true })
                    .setLngLat([e.lngLat.lng, e.lngLat.lat])
                    .setHTML(popupHtml)
                    .addTo(map);
            }
        };

        map.on('moveend', handleMoveEnd);
        map.on('click', handleClick);

        return () => {
            map.off('moveend', handleMoveEnd);
            map.off('click', handleClick);
            if (popupRef.current) {
                popupRef.current.remove();
                popupRef.current = null;
            }
        };
    }, [map, activeLayers]);

    return null;
}
