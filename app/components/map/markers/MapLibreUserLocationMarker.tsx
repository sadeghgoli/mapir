'use client';

import { useEffect, useRef } from 'react';
import * as maplibregl from 'maplibre-gl';
import { useMapLibre } from '@/app/contexts/MapLibreMapContext';

interface MapLibreUserLocationMarkerProps {
    position: [number, number];
}

export default function MapLibreUserLocationMarker({ position }: MapLibreUserLocationMarkerProps) {
    const map = useMapLibre();
    const sourceId = 'user-location-source';
    const outerCircleId = 'user-location-outer';
    const innerCircleId = 'user-location-inner';

    useEffect(() => {
        if (!map) return;
        if (!map.getSource(sourceId)) {
            map.addSource(sourceId, {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: [],
                },
            });

            map.addLayer({
                id: outerCircleId,
                type: 'circle',
                source: sourceId,
                paint: {
                    'circle-radius': 12,
                    'circle-color': '#60a5fa',
                    'circle-opacity': 0.3,
                    'circle-stroke-color': '#3b82f6',
                    'circle-stroke-width': 2,
                },
            });

            map.addLayer({
                id: innerCircleId,
                type: 'circle',
                source: sourceId,
                paint: {
                    'circle-radius': 6,
                    'circle-color': '#3b82f6',
                    'circle-stroke-color': '#2563eb',
                    'circle-stroke-width': 2,
                },
            });
        }

        return () => {
            if (map.getLayer(innerCircleId)) map.removeLayer(innerCircleId);
            if (map.getLayer(outerCircleId)) map.removeLayer(outerCircleId);
            if (map.getSource(sourceId)) map.removeSource(sourceId);
        };
    }, [map]);

    useEffect(() => {
        if (!map || !map.getSource(sourceId)) return;
        const src = map.getSource(sourceId) as maplibregl.GeoJSONSource;
        src.setData({
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: [position[1], position[0]],
                    },
                    properties: {},
                },
            ],
        });
    }, [map, position]);

    return (
        <style jsx global>{`
            @keyframes maplibre-pulse-location {
                0% { opacity: 1; }
                50% { opacity: 0.5; }
                100% { opacity: 1; }
            }
        `}</style>
    );
}
