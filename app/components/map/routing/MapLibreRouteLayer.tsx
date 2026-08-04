'use client';

import { useEffect, useState } from 'react';
import { maplibregl } from '@/app/libs/maplibre';
import { useMapLibre, useStyleLoaded } from '@/app/contexts/MapLibreMapContext';
import { X } from 'lucide-react';

export interface RouteData {
    origin: [number, number];
    destination: [number, number];
    originName?: string;
    destinationName?: string;
}

interface MapLibreRouteLayerProps {
    route: RouteData;
    onClear: () => void;
}

function formatDuration(seconds: number): string {
    if (seconds < 60) return 'کمتر از یک دقیقه';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h} ساعت و ${m} دقیقه`;
    return `${m} دقیقه`;
}

function formatDistance(meters: number): string {
    if (meters >= 1000) return `${(meters / 1000).toFixed(1)} کیلومتر`;
    return `${Math.round(meters)} متر`;
}

const ROUTE_SOURCE_ID = 'maplibre-route-source';
const ROUTE_LAYER_ID = 'maplibre-route-line';

export default function MapLibreRouteLayer({ route, onClear }: MapLibreRouteLayerProps) {
    const map = useMapLibre();
    const styleLoaded = useStyleLoaded();
    const [routeData, setRouteData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);

        const fetchRoute = async () => {
            try {
                const res = await fetch(
                    `/api/osrm/route?startLat=${route.origin[0]}&startLng=${route.origin[1]}&endLat=${route.destination[0]}&endLng=${route.destination[1]}`
                );
                if (cancelled) return;
                if (!res.ok) throw new Error('خطا در دریافت مسیر');

                const data = await res.json();
                if (cancelled) return;

                if (!data?.routes?.[0]) throw new Error('مسیری یافت نشد');
                setRouteData(data);
            } catch (err) {
                if (!cancelled) setError('خطا در دریافت مسیر');
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchRoute();

        return () => { cancelled = true; };
    }, [route.origin[0], route.origin[1], route.destination[0], route.destination[1]]);

    useEffect(() => {
        if (!map || !styleLoaded || !routeData?.routes?.[0]) return;

        const coords: number[][] = routeData.routes[0].geometry.coordinates;

        if (!map.getSource(ROUTE_SOURCE_ID)) {
            map.addSource(ROUTE_SOURCE_ID, {
                type: 'geojson',
                data: {
                    type: 'Feature',
                    properties: {},
                    geometry: {
                        type: 'LineString',
                        coordinates: coords,
                    },
                },
            });

            map.addLayer({
                id: ROUTE_LAYER_ID,
                type: 'line',
                source: ROUTE_SOURCE_ID,
                layout: {
                    'line-join': 'round',
                    'line-cap': 'round',
                },
                paint: {
                    'line-color': '#FF5722',
                    'line-width': 5,
                    'line-opacity': 0.8,
                },
            });
        } else {
            const src = map.getSource(ROUTE_SOURCE_ID) as maplibregl.GeoJSONSource;
            src.setData({
                type: 'Feature',
                properties: {},
                geometry: {
                    type: 'LineString',
                    coordinates: coords,
                },
            });
        }

        const lngLatBounds = new maplibregl.LngLatBounds(coords[0], coords[0]);
        coords.forEach((c: number[]) => lngLatBounds.extend(c as [number, number]));
        map.fitBounds(lngLatBounds, { padding: 80, maxZoom: 16 });

        return () => {
            if (map.getLayer(ROUTE_LAYER_ID)) map.removeLayer(ROUTE_LAYER_ID);
            if (map.getSource(ROUTE_SOURCE_ID)) map.removeSource(ROUTE_SOURCE_ID);
        };
    }, [map, styleLoaded, routeData]);

    if (loading) {
        return (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-[5000] bg-white rounded-xl shadow-xl px-5 py-3 flex items-center gap-3 text-sm">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <span>در حال محاسبه مسیر...</span>
            </div>
        );
    }

    if (error || !routeData?.routes?.[0]) {
        return (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-[5000] bg-white rounded-xl shadow-xl px-5 py-3 flex items-center gap-3 text-sm">
                <span className="text-red-500">{error || 'خطا'}</span>
                <button onClick={onClear} className="text-gray-400 hover:text-gray-600">
                    <X size={16} />
                </button>
            </div>
        );
    }

    const routeInfo = routeData.routes[0];

    return (
        <div
            className="absolute bottom-20 left-1/2 -translate-x-1/2 z-[5000] bg-white rounded-xl shadow-xl px-5 py-3 min-w-[260px]"
            dir="rtl"
        >
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-gray-800">مسیر رانندگی</span>
                <button onClick={onClear} className="text-gray-400 hover:text-gray-600 p-1">
                    <X size={16} />
                </button>
            </div>
            <div className="flex items-center justify-center gap-6 text-sm">
                <div className="flex items-center gap-1.5">
                    <span className="text-gray-500">فاصله:</span>
                    <span className="font-semibold text-gray-800">
                        {formatDistance(routeInfo.distance)}
                    </span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="text-gray-500">زمان:</span>
                    <span className="font-semibold text-gray-800">
                        {formatDuration(routeInfo.duration)}
                    </span>
                </div>
            </div>
        </div>
    );
}
