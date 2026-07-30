'use client';

import { useEffect } from 'react';
import * as maplibregl from 'maplibre-gl';
import { useMapLibre } from '@/app/contexts/MapLibreMapContext';

const alleyways = [
    {
        name: 'کوچه گلستان',
        positions: [
            [36.2120, 57.6650],
            [36.2115, 57.6660],
            [36.2110, 57.6670],
            [36.2105, 57.6680],
        ] as [number, number][],
    },
    {
        name: 'کوچه بهار',
        positions: [
            [36.2110, 57.6660],
            [36.2115, 57.6650],
            [36.2125, 57.6640],
            [36.2130, 57.6635],
        ] as [number, number][],
    },
    {
        name: 'کوچه سعدی',
        positions: [
            [36.2090, 57.6670],
            [36.2095, 57.6675],
            [36.2100, 57.6680],
            [36.2105, 57.6685],
        ] as [number, number][],
    },
    {
        name: 'کوچه فردوسی',
        positions: [
            [36.2105, 57.6660],
            [36.2110, 57.6655],
            [36.2115, 57.6650],
        ] as [number, number][],
    },
    {
        name: 'کوچه مولوی',
        positions: [
            [36.2118, 57.6670],
            [36.2123, 57.6678],
            [36.2128, 57.6685],
        ] as [number, number][],
    },
    {
        name: 'کوچه حافظ',
        positions: [
            [36.2095, 57.6655],
            [36.2100, 57.6660],
            [36.2105, 57.6665],
        ] as [number, number][],
    },
];

const COLORS = ['#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22'];

const SOURCE_PREFIX = 'kooche-source-';
const LAYER_PREFIX = 'kooche-layer-';
const LABEL_SOURCE = 'kooche-label-source';

export default function MapLibreKoocheLayer() {
    const map = useMapLibre();

    useEffect(() => {
        if (!map) return;

        const lineFeatures = alleyways.map((alley, i) => ({
            type: 'Feature' as const,
            properties: { name: alley.name, index: i },
            geometry: {
                type: 'LineString' as const,
                coordinates: alley.positions.map(p => [p[1], p[0]]),
            },
        }));

        const labelFeatures = alleyways.map((alley, i) => ({
            type: 'Feature' as const,
            properties: { name: alley.name },
            geometry: {
                type: 'Point' as const,
                coordinates: (() => {
                    const midIdx = Math.floor(alley.positions.length / 2);
                    const p = alley.positions[midIdx];
                    return [p[1], p[0]];
                })(),
            },
        }));

        lineFeatures.forEach((feature, i) => {
            const sourceId = `${SOURCE_PREFIX}${i}`;
            const layerId = `${LAYER_PREFIX}${i}`;
            const color = COLORS[i % COLORS.length];

            map.addSource(sourceId, {
                type: 'geojson',
                data: feature,
            });

            map.addLayer({
                id: layerId,
                type: 'line',
                source: sourceId,
                layout: {
                    'line-join': 'round',
                    'line-cap': 'round',
                },
                paint: {
                    'line-color': color,
                    'line-width': 3,
                    'line-opacity': 0.85,
                    'line-dasharray': [8, 6],
                },
            });
        });

        if (!map.getSource(LABEL_SOURCE)) {
            map.addSource(LABEL_SOURCE, {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: labelFeatures,
                },
            });

            map.addLayer({
                id: 'kooche-labels',
                type: 'symbol',
                source: LABEL_SOURCE,
                layout: {
                    'text-field': ['get', 'name'],
                    'text-size': 12,
                    'text-offset': [0, -1.5],
                    'text-anchor': 'bottom',
                },
                paint: {
                    'text-color': '#333',
                    'text-halo-color': '#fff',
                    'text-halo-width': 2,
                },
            });
        }

        return () => {
            alleyways.forEach((_, i) => {
                const sourceId = `${SOURCE_PREFIX}${i}`;
                const layerId = `${LAYER_PREFIX}${i}`;
                if (map.getLayer(layerId)) map.removeLayer(layerId);
                if (map.getSource(sourceId)) map.removeSource(sourceId);
            });
            if (map.getLayer('kooche-labels')) map.removeLayer('kooche-labels');
            if (map.getSource(LABEL_SOURCE)) map.removeSource(LABEL_SOURCE);
        };
    }, [map]);

    return null;
}
