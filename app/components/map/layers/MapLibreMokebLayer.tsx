'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import * as maplibregl from 'maplibre-gl';
import { useMapLibre } from '@/app/contexts/MapLibreMapContext';
import { getFirstPoint, setPoints, removeAllPoints } from '@/app/utils/urlManager';
import MokebModal from '../overlays/MokebModal';
import MapLibreRouteLayer from '../routing/MapLibreRouteLayer';
import type { RouteData } from '../routing/MapLibreRouteLayer';

interface ApiMokeb {
    id: string;
    title: string;
    description: string;
    latitude: number;
    longitude: number;
    categoryName: string;
    categoryIcon: string;
    categoryColor: string;
    status: number;
    submittedByName: string;
    submittedAt: string;
    visitCount: number;
}

interface ApiResponse {
    success: boolean;
    data: ApiMokeb[];
    totalCount: number;
}

const iconMap: Record<string, string> = {
    eskan: '/images/logo1.png',
    mokeb: '/images/logo2.png',
};

export default function MapLibreMokebLayer() {
    const map = useMapLibre();
    const [points, setPointsState] = useState<ApiMokeb[]>([]);
    const [selected, setSelected] = useState<ApiMokeb | null>(null);
    const [loading, setLoading] = useState(true);
    const [routeData, setRouteData] = useState<RouteData | null>(null);
    const initDone = useRef(false);
    const markersRef = useRef<maplibregl.Marker[]>([]);
    const popupsRef = useRef<Map<string, maplibregl.Popup>>(new Map());

    const urlMokebId = getFirstPoint('mokeb');

    const openMokeb = useCallback((item: ApiMokeb) => {
        setSelected(item);
        setRouteData(null);
        setPoints('mokeb', [item.id]);
        if (map) {
            map.flyTo({ center: [item.longitude, item.latitude], zoom: 18, duration: 1000 });
        }
    }, [map]);

    const handleCloseModal = useCallback(() => {
        setSelected(null);
        removeAllPoints('mokeb');
    }, []);

    const handleShowRoute = useCallback((originLat: number, originLng: number) => {
        if (!selected) return;
        setRouteData({
            origin: [originLat, originLng],
            destination: [selected.latitude, selected.longitude],
            destinationName: selected.title,
        });
        setSelected(null);
    }, [selected]);

    const handleClearRoute = useCallback(() => {
        setRouteData(null);
    }, []);

    useEffect(() => {
        fetch('/api/map-point/api/MapPoint?page=1&pageSize=50')
            .then(res => res.json())
            .then((data: ApiResponse) => {
                if (data.success) {
                    setPointsState(data.data);
                    if (urlMokebId && !initDone.current) {
                        const found = data.data.find(p => p.id === urlMokebId);
                        if (found) {
                            initDone.current = true;
                            setSelected(found);
                            if (map) {
                                map.jumpTo({ center: [found.longitude, found.latitude], zoom: 18 });
                            }
                        }
                    }
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (!map || loading || points.length === 0) return;

        markersRef.current.forEach(m => m.remove());
        markersRef.current = [];
        popupsRef.current.forEach(p => p.remove());
        popupsRef.current = new Map();

        points.forEach((item) => {
            const src = iconMap[item.categoryIcon] || '/images/logo2.png';

            const el = document.createElement('div');
            el.style.width = '45px';
            el.style.height = '45px';
            el.style.overflow = 'hidden';
            el.style.display = 'flex';
            el.style.alignItems = 'center';
            el.style.justifyContent = 'center';
            el.style.cursor = 'pointer';

            const img = document.createElement('img');
            img.src = src;
            img.alt = item.categoryIcon;
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'cover';
            el.appendChild(img);

            const popupHtml =
                '<div style="text-align:center;font-family:IRANSans,sans-serif;min-width:150px;direction:rtl">' +
                '<strong style="font-size:14px;color:#333">' + item.title + '</strong>' +
                '<p style="font-size:11px;margin:6px 0 0;color:#666">' + item.description + '</p>' +
                '</div>';

            const popup = new maplibregl.Popup({
                closeButton: false,
                closeOnClick: false,
                maxWidth: '250px',
            }).setHTML(popupHtml);

            popupsRef.current.set(item.id, popup);

            const marker = new maplibregl.Marker({ element: el })
                .setLngLat([item.longitude, item.latitude])
                .setPopup(popup)
                .addTo(map);

            el.addEventListener('mouseenter', () => {
                marker.getPopup()?.addTo(map);
            });

            el.addEventListener('mouseleave', () => {
                marker.getPopup()?.remove();
            });

            el.addEventListener('click', () => {
                openMokeb(item);
            });

            markersRef.current.push(marker);
        });

        return () => {
            markersRef.current.forEach(m => m.remove());
            markersRef.current = [];
            popupsRef.current.forEach(p => p.remove());
            popupsRef.current = new Map();
        };
    }, [map, points, loading, openMokeb]);

    if (loading || points.length === 0) return null;

    return (
        <>
            <MokebModal
                isOpen={!!selected}
                onClose={handleCloseModal}
                data={selected}
                onShowRoute={handleShowRoute}
            />

            {routeData && (
                <MapLibreRouteLayer route={routeData} onClear={handleClearRoute} />
            )}
        </>
    );
}
